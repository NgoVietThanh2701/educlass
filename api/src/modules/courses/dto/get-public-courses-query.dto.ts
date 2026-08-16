import { PaginationDto } from '@common/dto/pagination.dto';

/**
 * Query params for the public course catalog. Reuses the shared `PaginationDto`
 * (page + limit, limit capped at 50). Featured courses on the landing page call
 * `page=1&limit=6`; the upcoming "all courses" page will page through the rest.
 */
export class GetPublicCoursesQueryDto extends PaginationDto {}
