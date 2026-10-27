const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
process.env.NODE_ENV = 'test';
const TokenService = require('../../backend/services/auth-service/src/services/tokenService');
const models = require('../../backend/services/auth-service/src/models');
const authMiddleware = require('../../backend/services/auth-service/src/middlewares/authMiddleware');
const consumers = ['content','exam','quality'].map(name => require('../../backend/services/' + name + '-service/src/middlewares/authMiddleware'));
function response() { const result = { code: 200, body: null }; result.status = code => { result.code=code; return result; }; result.json = body => { result.body=body; return result; }; return result; }
test('RIC-11: consumidores consultan autoridad HTTP y respetan revocación sin inyectar cachés locales', async t => {
    t.mock.method(models.Usuario,'findByPk',async()=>({ activo:true, rol:{ nombre_rol:'estudiante' } }));
    t.mock.method(models.Sesion,'findOne',async()=>({ activa:true }));
    const user={id:88,rol:'estudiante'};
    const token=TokenService.generateToken(user);
    const server=http.createServer(async(req,res)=>{
        const result=await TokenService.verifyToken(req.headers.authorization.slice(7));
        res.writeHead(result.valid?200:401,{'Content-Type':'application/json'});
        res.end(JSON.stringify(result.valid?{valid:true,user:{...user,activo:true}}:{valid:false}));
    });
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const previous=process.env.AUTH_SERVICE_URL;
    process.env.AUTH_SERVICE_URL='http://127.0.0.1:'+server.address().port;
    try {
        for(const middleware of [authMiddleware,...consumers]) {
            let next=false; await middleware.verifyToken({headers:{authorization:'Bearer '+token}},response(),()=>{next=true;});
            assert.equal(next,true);
        }
        assert.equal(await TokenService.revokeToken(token),true);
        for(const middleware of [authMiddleware,...consumers]) {
            const res=response(); await middleware.verifyToken({headers:{authorization:'Bearer '+token}},res,()=>assert.fail('Token revocado aceptado'));
            assert.equal(res.code,401);
        }
    } finally { if(previous===undefined)delete process.env.AUTH_SERVICE_URL;else process.env.AUTH_SERVICE_URL=previous; await new Promise(resolve=>server.close(resolve)); }
});
test('RIC-AC-02: credenciales MFA restringidas no sirven como sesión de negocio', async()=>{
    const token=TokenService.generateChallengeToken({id:99});
    for(const middleware of [authMiddleware,...consumers]) {
        const res=response();await middleware.verifyToken({headers:{authorization:'Bearer '+token}},res,()=>assert.fail('MFA aceptado como sesión'));
        assert.equal(res.code,401);
    }
});
test('RIC-11: autoridad no disponible falla cerrado en servicios consumidores', async()=>{
    const token=TokenService.generateToken({id:88,rol:'estudiante'}),previous=process.env.AUTH_SERVICE_URL;
    process.env.AUTH_SERVICE_URL='http://127.0.0.1:1';
    try { for(const middleware of consumers) { const res=response();await middleware.verifyToken({headers:{authorization:'Bearer '+token}},res,()=>assert.fail('Fallo abierto'));assert.equal(res.code,503); } }
    finally { if(previous===undefined)delete process.env.AUTH_SERVICE_URL;else process.env.AUTH_SERVICE_URL=previous; }
});
