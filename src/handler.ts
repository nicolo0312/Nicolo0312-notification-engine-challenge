import { parseEvent, DomainEvent } from './events';
import { FakeMachineRepository } from './repositories/machine.repository';
import { FakeUserRepository } from './repositories/user.repository';

const PROJECT_MANAGER = 'project_manager';
const COMPANY_ADMIN = 'company_admin';
const SITE_SUPERVISOR = 'site_supervisor';


export function handler(rawEvent: unknown): unknown {
  try {
    const userRepo = new FakeUserRepository();
    const machineRepo = new FakeMachineRepository();
    const event: DomainEvent = parseEvent(rawEvent);
    let notifications: any[] = []
  
    switch(event['detail-type']){
      case 'MachineMoved':
        const {to_project_id} = event.detail;
        const supervisors = userRepo.getUsersByRoleInProject(to_project_id, SITE_SUPERVISOR)
        return supervisors.map((user) => ({
          recipient_id: user.id,
          payload: event.detail,
        }));
      
      case 'OOSReportBatchCreated':

      const projectsIds = new Set(event.detail.reports.map((r) => r.project_id))
        for (const projectId of projectsIds) {
          const pms = userRepo.getUsersByRoleInProject(
            projectId,
            PROJECT_MANAGER
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
        for (const doc of event.detail.documents) {
          const machine = machineRepo.getById(doc.machine_id);
          if(!machine) continue;
          const admins = userRepo.getUsersByRoleInCompany(machine.company_id, COMPANY_ADMIN)

          for (const admin of admins) {
            notifications.push({
              recipient_id: admin.id,
              payload: { documents: [doc]}
            })
          }
        }
        return notifications;
  
      default:
        throw new Error('Unhandled event type')
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
}
