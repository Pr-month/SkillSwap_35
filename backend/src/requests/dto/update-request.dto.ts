import { IsIn } from 'class-validator';
import { RequestStatus } from '../entities/request.entity';

export class UpdateRequestDto {
  @IsIn([RequestStatus.ACCEPTED, RequestStatus.REJECTED])
  status: RequestStatus.ACCEPTED | RequestStatus.REJECTED;
}
