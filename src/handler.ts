import { parseEvent, DomainEvent } from './events';
import { FakeUserRepository } from './repositories/user.repository';


export function handler(rawEvent: unknown): unknown {
  try {
    const userRepo = new FakeUserRepository();
    const event: DomainEvent = parseEvent(rawEvent);
  
    switch(event['detail-type']){
      case 'MachineMoved':
        const {to_project_id} = event.detail;
        const supervisors = userRepo.getUsersByRoleInProject(to_project_id, 'site_supervisor')
        return supervisors.map((user) => ({
          recipient_id: user.id,
          payload: event.detail,
        }));
      
      case 'OOSReportBatchCreated':

      const projectsIds = new Set(event.detail.reports.map((r) => r.project_id))
        const notifications: any[] = [];

        for (const projectId of projectsIds) {
          const pms = userRepo.getUsersByRoleInProject(
            projectId,
            'project_manager'
          );
          for (const pm of pms){
            notifications.push({
              recipient_id: pm.id,
              payload: {project: projectId}
            })
          }
        }
        return notifications;
  
      case 'DocumentsExpiring':
        return [];
  
      default:
        throw new Error('Unhandled event type')
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
}
