# Decisiones

## 1. Estructura de routing

¿Cómo estructuraste el routing del tipo de evento al handler? ¿Qué cambiaría con 20 tipos de eventos?

> Estructure el routing utilizando un switch sobre el campo del evento ( event['detail-type']), aprovechando que los eventos ya vienen tipados mediante un discriminatedUnion de Zod.
> Esta solución es simple, explicita y suficiente para una cantidad pequeña de eventos, ya que mantiene toda la logica en un unico lugar facil de leer.
> Si el sistema creciera a 20 tipos de eventos, migraria a un enfoque basado en un mapa de handlers.
> Ej: 
> const handlers: Record<string, (event: DomainEvent) => Notification[]> = {
>    MachineMoved: handleMachineMoved,
>    OOSReportBatchCreated: handleOOSReportBatchCreated,
>    DocumentsExpiring: handleDocumentsExpiring,
> };

> Con esto lograria:
> A- Evitar logica condicional extensa
> B- Facilitar la extensibilidad
> C- Separar responsabilidades (cada handler en su propio modulo).



## 2. Extensibilidad multi-canal

¿Cómo extenderías esto para soportar notificaciones por email y push por usuario?

> Separaria la generacion de notificaciones de su entrega. 
> Actualmente, el sistema devuelve una lista de notificaciones:
> Type Notification = {
>   recipient_id: string;
>   payload: unknown;    
>}

> Para soportar multiples canales (email, push), introduciria una capa adicional:
> 1- Extender el modelo de usuario con preferencias, ej:
>   channels: ('email', 'push')[]

> 2- Crear un dispatcher de notificaciones:
>   for (const notification of notifications) {
>     const user = userRepo.getById(notification.recipient_id);

>   for (const channel of user.channels) {
>     send(channel, notification);
>   }
>  }

> 3- Implementar adaptadores por canal:
>   . EmailService
>   . PushService

> De esta forma la entrega  queda desacoplada y es facil agregar nuevos canales sin modificar la logica de negocio.

## 3. Planificación y uso de IA

Antes de escribir código, ¿cómo planificaste la solución? (ej: pseudocódigo, un esquema rápido, una lista de pasos)

Si usaste herramientas de IA: ¿qué le pediste, qué aceptaste tal cual y qué cambiaste o rechazaste? Un ejemplo concreto vale más que una descripción general.

Si no usaste IA: ¿por qué no?

> Antes de escribir codigo, modelé el problema como un flujo simple:
> evento -> validación -> seleccion de regla -> generacion de notificaciones.
> Identifique algunos invariantes:
>   . Siempre se recibe un evento tipado
>   . Cada tipo de evento tiene una única regla de negocio asociada.
>   . El output es siempre una lista de notificaciones

> Tambien identifique los puntos variables:
>   . La lógica especifica por tipo de evento
>   . La forma de agrupar o deduplicar datos (por proyecto, empresa, etc.)

> Teniendo en cuenta eso, decidi mantener una solución simple, centrada en funciones, evitando abstraer de mas.

> En cuanto al uso de IA, la utilice como herramienta de apoyo para:
>   . Validar enfoques de diseño (por ejemplo, si usar switch o handler map)
>   . Detectar posibles edge cases (deduplicacion, agrupamiento)
>   . Revisar claridad y estructura de soluciones

> La implementacion final fue ajustada manualmente priorizando legibilidad, simplicidad y alineacion con los requisitos del problema.

## 4. Extensión sin romper lo existente

Si mañana aparece un nuevo evento con una regla de negocio distinta, ¿qué partes de tu implementación tendrías que tocar y cuáles no?

> Esto dependeria por que camino se sigue. En caso de seguir por el switch ( caso no viable si se empiezan a agregar cada vez mas eventos), habria que agregar un nuevo case con su respectiva logica de negocio.
> Por lo que habria que modificar la funcion principal (handler) agregando nueva logica, los repositorios seguirian intactos.
> En caso de utilizar handler map, habria que generar una nueva entrada con el evento correspondiente, e implementar un nuevo handler para ese evento.



## ACLARACION.

> No utilice el ProjectRepository porque la informacion necesaria para cumplir las reglas ya estaba dispnible en los eventos o podia obtenerse directamente desde otros repositorios.
> Preferi evitar dependencias innecesarias para mantener la solucion simple y enfocada en el requerimiento.
> Si en el futuro necesitara agregar alguna informacion extra en el payload o resolver relaciones mas complejas, consideraria incorporar ProjectRepository.