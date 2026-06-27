export class UserNameUtil {
  private static getYear(): string {
    return new Date().getFullYear().toString().slice(-2);
  }

  static teacher(teacherNo: number): string {
    return `tea${this.getYear()}${teacherNo.toString().padStart(5, '0')}`;
  }

  static student(studentNo: number): string {
    return `stu${this.getYear()}${studentNo.toString().padStart(5, '0')}`;
  }
}
