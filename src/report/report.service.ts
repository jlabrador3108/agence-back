import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma/prisma.service';
import { ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsersReport(query: ReportQueryDto) {
    // Step 1: Fetch consultants and related OS + invoices
    const { users, startDate, endDate } = query;
    const data = await this.prisma.cao_usuario.findMany({
      where: {
        co_usuario: { in: users },
      },
      include: {
        cao_salario_pag: true,
        cao_salario: true,
        cao_os: {
          include: {
            cao_fatura: {
              where: {
                data_emissao: {
                  gte: new Date(startDate),
                  lte: new Date(endDate),
                },
              },
            },
          },
        },
      },
    });

    // Step 2: Calculate metrics per month
    const report = data.map((user) => {
      const salary = user.cao_salario[0]?.brut_salario ?? 0;
      const invoices = user.cao_os.flatMap((os) => os.cao_fatura);

      // Group by month
      const monthly = new Map<string, any>();

      for (const inv of invoices) {
        const month = inv.data_emissao.toISOString().slice(0, 7); // 'YYYY-MM'
        const VALOR = Number(inv.valor);
        const TAX = Number(inv.total_imp_inc);
        const COMM = Number(inv.comissao_cn);

        const receitaLiquida = VALOR - (VALOR * TAX) / 100;
        const comissao = receitaLiquida * (COMM / 100);
        const custoFixo = Number(salary);
        const lucro = receitaLiquida - (custoFixo + comissao);

        if (!monthly.has(month)) {
          monthly.set(month, {
            receitaLiquida: 0,
            custoFixo,
            comissao: 0,
            lucro: 0,
          });
        }
        const m = monthly.get(month);
        m.receitaLiquida += receitaLiquida;
        m.comissao += comissao;
        m.lucro = m.receitaLiquida - (m.custoFixo + m.comissao);
      }

      return {
        consultant: user.no_usuario,
        co_usuario: user.co_usuario,
        months: Object.fromEntries(monthly),
      };
    });

    return report;
  }

  async getGraphData(query: ReportQueryDto) {
    // Step 1: Fetch consultants and related OS + invoices
    const { users, startDate, endDate } = query;

    const data = await this.prisma.cao_usuario.findMany({
      where: {
        co_usuario: { in: users },
      },
      include: {
        cao_salario: true,
        cao_os: {
          include: {
            cao_fatura: {
              where: {
                data_emissao: {
                  gte: new Date(startDate),
                  lte: new Date(endDate),
                },
              },
            },
          },
        },
      },
    });

    // Step 1️⃣: Calculate receita líquida for consultant
    const results = data.map((user) => {
      const salary = user.cao_salario[0]?.brut_salario ?? 0;
      const invoices = user.cao_os.flatMap((os) => os.cao_fatura);

      const monthlyReceitas = new Map<string, number>();

      for (const inv of invoices) {
        if (!inv.data_emissao) continue;

        const month = inv.data_emissao.toISOString().slice(0, 7); // YYYY-MM
        const VALOR = Number(inv.valor);
        const TAX = Number(inv.total_imp_inc);
        const receitaLiquida = VALOR - (VALOR * TAX) / 100;

        monthlyReceitas.set(
          month,
          (monthlyReceitas.get(month) || 0) + receitaLiquida,
        );
      }

      return {
        consultant: user.no_usuario,
        co_usuario: user.co_usuario,
        salary,
        monthlyReceitas,
      };
    });

    // Step 2️⃣: get month labels
    const allMonths = Array.from(
      new Set(results.flatMap((r) => Array.from(r.monthlyReceitas.keys()))),
    ).sort();

    // Step 3️⃣: Calculate average fixed cost
    const custoFixoMedio =
      results.reduce((sum, r) => sum + r.salary, 0) / (results.length || 1);

    // Step 4️⃣: Prepare datasets for each consultant
    const datasets = results.map((r) => ({
      consultant: r.consultant,
      data: allMonths.map((m) => r.monthlyReceitas.get(m) || 0),
    }));

    // Step 5️⃣: Return graph data
    const graph = {
      labels: allMonths, // ["2025-01", "2025-02", ...]
      datasets, // [{consultant, data: [..]}, ...]
      custoFixoMedio,
    };

    return graph;
  }

  async getPieData(query: ReportQueryDto) {
    // Step 1: Fetch consultants and related OS + invoices
    const { users, startDate, endDate } = query;
    // 1️⃣ Get consultants with their OS and invoices
    const data = await this.prisma.cao_usuario.findMany({
      where: {
        co_usuario: { in: users },
      },
      include: {
        cao_os: {
          include: {
            cao_fatura: {
              where: {
                data_emissao: {
                  gte: new Date(startDate),
                  lte: new Date(endDate),
                },
              },
            },
          },
        },
      },
    });

    // 2️⃣ Calcular receita líquida por consultor
    const results = data.map((user) => {
      const invoices = user.cao_os.flatMap((os) => os.cao_fatura);

      const receitaLiquida = invoices.reduce((sum, inv) => {
        const VALOR = Number(inv.valor);
        const TAX = Number(inv.total_imp_inc);
        return sum + (VALOR - (VALOR * TAX) / 100);
      }, 0);

      return {
        consultant: user.no_usuario,
        co_usuario: user.co_usuario,
        receitaLiquida,
      };
    });

    // 3️⃣ Calculate receita total
    const receitaTotal = results.reduce((sum, r) => sum + r.receitaLiquida, 0);

    // 4️⃣ Calculate percentage for each consultant
    const pieData = results.map((r) => ({
      consultant: r.consultant,
      co_usuario: r.co_usuario,
      receitaLiquida: r.receitaLiquida,
      percentage:
        receitaTotal > 0 ? (r.receitaLiquida / receitaTotal) * 100 : 0,
    }));

    return {
      total: receitaTotal,
      data: pieData,
    };
  }
}
