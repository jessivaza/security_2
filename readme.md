#CONFIGURAR LA CONEXIÓN A LA BD:
-Ingresar a la carpeta settings.py y modificar "DATABASES" con los datos de tu base de datos en POSTGRESQL



1. **Instalar dependencias**
   ```
   pip install -r requirements.txt
   ```

2. **Ejecutar migraciones a la BD y crear superusuario**
   ```
   py manage.py makemigrations 
   py manage.py migrate
   py manage.py createsuperuser 
   ```

3. **Ejecutar el servidor**
``` 
py manage.py runserver
```