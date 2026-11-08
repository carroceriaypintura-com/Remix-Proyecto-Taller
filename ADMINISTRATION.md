# Administración privada

La página pública no enlaza herramientas administrativas, no muestra avisos para el propietario y no escribe cotizaciones en Firestore. Los clientes conservan el cotizador y el contacto por WhatsApp.

El propietario puede abrir `/administracion` directamente e iniciar sesión con su cuenta de Google. Antes de cargar el panel se exige correo verificado y ser el propietario ya definido en las reglas o tener un documento `admins/<Firebase UID>`. No hay registro público de administradores. Solo el propietario verificado puede conceder o revocar esos documentos; nunca los cree desde código público. Un usuario sin permiso ve acceso denegado. Noindex y ocultar enlaces no son medidas de autorización.

## Paso obligatorio en Firebase

Publicar el sitio en Vercel **no publica** `firestore.rules`. Antes de considerar protegidos los datos, revisar y publicar el archivo de reglas de esta rama en la base de Firestore configurada en `firebase-applet-config.json`. No se dispone aquí de credenciales para publicar reglas ni comprobar las que están actualmente activas.

Las nuevas reglas reservan todas las lecturas y escrituras de cotizaciones al propietario verificado y a los miembros autorizados. Los clientes ya no crean cotizaciones en la base desde la web; deben enviarlas por WhatsApp. Se conservan las reseñas públicas. No se borran datos ni cuentas.

Comprobar con las reglas publicadas: visitante y usuario ordinario no pueden leer ni escribir cotizaciones; cuenta no verificada tampoco; propietario y miembro autorizado sí; un miembro no puede conceder permisos a otros. Verificar inicio de sesión en el dominio autorizado en Firebase, desconexión y revocación de membresía. Los cambios de membresía se aplican en la base de datos por las reglas; una sesión abierta puede necesitar recargar para actualizar su interfaz.

No se probó el flujo autenticado por falta de cuenta de pruebas. No se dispone de Java para ejecutar el emulador de Firestore en este entorno; los tests locales de la política no sustituyen pruebas de las reglas en Firebase.
