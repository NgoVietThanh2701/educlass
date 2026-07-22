// format date time to response api
export function convertUtcToVietnamTime(utc: Date): string {
  return new Date(utc).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}
