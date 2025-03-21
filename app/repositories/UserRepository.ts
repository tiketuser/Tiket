import { prisma } from "@/app/lib/db";

class UserRepository {
  async createUser(name: string, email: string, hashedPassword: string) {
    return await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });
  }

  async findUserByEmail(email: string) {
    return await prisma.user.findUnique({ where: { email } });
  }

  async findUserById(id: string) {
    return await prisma.user.findUnique({ where: { id } });
  }

  async updateUser(id: string, data: Partial<{ name: string; email: string; password: string }>) {
    return await prisma.user.update({ where: { id }, data });
  }

  async deleteUser(id: string) {
    return await prisma.user.delete({ where: { id } });
  }
}

export default new UserRepository();
