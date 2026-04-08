import { parseEvent, DomainEvent } from './events';


export function handler(rawEvent: unknown): unknown {
  try {
    const event: DomainEvent = parseEvent(rawEvent);
  
    switch(event['detail-type']){
      case 'MachineMoved':
        return [];
      
      case 'OOSReportBatchCreated':
        return [];
  
      case 'DocumentsExpiring':
        return [];
  
      default:
        throw new Error('Unhandled event type')
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
}
