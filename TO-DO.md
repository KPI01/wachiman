# TO-DO

- [x] Cuando se apruebe una solicitud de acceso, debe solicitar la documentación de la persona que va a ingresar a la empresa. Posteriormente, procederá a guardar los datos dentro de la base de datos
- [x] Reducir el tamaño del logo en el branding del navbar de los usuarios
- [x] Rediseñar los navbar de los usuarios para hacerlos más intuitivos y cómodos
- [x] **BUG**: El registro de acceso de una solicitud de acceso, arroja el error: "La solicitud planificada no corresponde con el dia actual"
- [x] Crear una opción para que los usuarios ADMIN, SECURITY_MANAGER y ACCESS_APPROVER puedan modificar ciertos datos de los registros: hora salida,motivo, persona, empresa
- [x] Modificar el autocompletado del portero, agregar autocompletado en empresa
- [x] Crear advertencias para accesos que no han tenido ninguna salida durante el dia, que sigan "estando dentro" aun habiendo pasado más de un dia
- [x] Permitir editar las solicitudes
- [x] Cuando un usuario ya esté registrado, si ya tiene documentación, debe permitir visualizarla
- [x] Los metadatos del audit_log deberían poder visualizarse
- [x] En el sidebar, en todos los roles, tiene que tener el nombre de la aplicación. El nombre de usuario y rol debe aparecer abajo
  - [x] Cambiar el boton de cierre de sesión por un desplegable con opciones
- [x] Mejorar los tamaños de los botones de las tablas, hacerlos del mismo tamaño y que sean mejor adaptados a una tabla (con iconos en lugar de texto, el texto tiene que ser un tooltip)
- [x] En la edición de un AccessLog, para buscar personas ya registradas, el campo de buscar tiene que ser una lupa al lado del DNI/NIE que luego tenga el combobox de busqueda y selección
- [x] Mejorar (hacer más intuitivos y agradables a la vista, preservando el estilo de la app) los filtros en la pagina de 'access-logs'
- [x] Eliminar aviso al final de la edición de un AccessLog (el cartel que dice 'esta información quedara atribuida a tu usuario', o algo así)
- [x] Hay un bug en la tabla de trabajadores externos, no salta el tooltip ni hace nada al hacer click
- [x] El sheet donde se ven los metadatos de la auditoria, no es responsive. Los datos se ven mal
- [x] Colocar los filtros dentro de los encabezados de las columnas
- [ ] Acciones sobre documentación de trabajadores
- [ ] En registro de acceso agregar: zona autorizada para trabajar, quien autoriza el acceso
- [ ] Opción que permite el acceso con dispositivos electronicos mediante la solicitud (normativa nueva)
- [ ] Desplegable en tipo de vehículo al registrar el acceso
- [ ] Asociar un registro de acceso a una solicitud existente
  > ¿Por que esto? Porque muchas veces una solicitud tiene una persona aprobada, pero luego por cualquier razón, se presenta otra. Entonces tiene que haber una opción que permita asociar este registro a una persona
  > O, ¿modificar los datos de la solicitud? Creo que esto no es viable porque cuando esta aprobada la solicitud, se registra en la BD
- [ ] Registrar en la BD cuando se registra un acceso
