import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  listConsultants() {
    const users = this.prisma.cao_usuario.findMany({
      select:{
        co_usuario: true,
        no_usuario: true,
        permissao_sistemas: true,
      },
      where: {
        permissao_sistemas: {
          some: {
            co_sistema: 1,
            in_ativo: 'S',
            co_tipo_usuario: { in: [0, 1, 2] },
          },
        },
      },
    });
    return users;
  }
}
