const app = require('./app');
const config = require('./config/env');

app.listen(config.PORT, () => {
    console.log(`Quality Service escuchando en puerto ${config.PORT}`);
});
