export class UserService {
  async getUser(
    userId: string,
  ): Promise<{ id: number; email: string; avatar: string }> {
    const userApi = await fetch(`https://reqres.in/api/users/${userId}`);
    const json = await userApi.json();
    return json.data;
  }
}
