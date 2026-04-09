import { parseEvent, DomainEvent } from './events';
import { FakeMachineRepository } from './repositories/machine.repository';
import { FakeUserRepository } from './repositories/user.repository';

const PROJECT_MANAGER = 'project_manager';
const COMPANY_ADMIN = 'company_admin';
const SITE_SUPERVISOR = 'site_supervisor';
const userRepo = new FakeUserRepository();
const machineRepo = new FakeMachineRepository();
type Notification = {
  recipient_id: string;
  payload?: unknown;
}

export function handler(rawEvent: unknown): Notification[] {
    const event: DomainEvent = parseEvent(rawEvent);
  
    switch(event['detail-type']){
      case 'MachineMoved':{
        const notifications : Notification[] = []
        const {to_project_id} = event.detail;
        const supervisors = userRepo.getUsersByRoleInProject(to_project_id, SITE_SUPERVISOR)

        for (const user of supervisors){
          notifications.push({
            recipient_id: user.id,
            payload: event.detail
          })
        }
        
        return notifications;
      }
      
      case 'OOSReportBatchCreated':{
        const notifications: Notification[] = [];
        // Use Set to avoid duplicate notifications for the same project
        const projectsIds = new Set(event.detail.reports.map((r) => r.project_id))
          for (const projectId of projectsIds) {
            const pms = userRepo.getUsersByRoleInProject(
              projectId,
              PROJECT_MANAGER
            );
            for (const pm of pms){
              notifications.push({
                recipient_id: pm.id,
                payload: {project_id: projectId}
              })
            }
          }
          return notifications;
      }
  
      case 'DocumentsExpiring':{
        const notifications: Notification[] = [];
        // Group documents by company to send one notification per company
        const companyDocumentsMap: Record <string, any[]> = {};
        for (const doc of event.detail.documents) {
          const machine = machineRepo.getById(doc.machine_id);
          if(!machine) continue;

          const companyId = machine.company_id;

          if(!companyDocumentsMap[companyId]){
            companyDocumentsMap[companyId] = [];
          }

          companyDocumentsMap[companyId].push(doc);
        }
        // Notify all company admins with aggregated documents
        for(const companyId in companyDocumentsMap){
          const admins = userRepo.getUsersByRoleInCompany( companyId, COMPANY_ADMIN)

          for (const admin of admins) {
            notifications.push({
              recipient_id: admin.id,
              payload: { documents: companyDocumentsMap[companyId]}
            })
          }

        }
        return notifications;
      }
  
      default:
        throw new Error('Unhandled event type')
    }
}
