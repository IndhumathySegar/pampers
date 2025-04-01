import { IUser as CustomUser } from '../entities/interfaces/iUser';

declare global {
    namespace Express {
        export interface Request {
            user: CustomUser;
        }
    }
}