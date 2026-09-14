FROM nginx:alpine

# Copiar configuración personalizada
COPY conf/nginx.conf /etc/nginx/nginx.conf

# Exponer puerto
EXPOSE 3000

# Iniciar NGINX
CMD ["nginx", "-g", "daemon off;"]