const { chartjsToImage, ChartJSNodeCanvas } = require('chartjs-to-image');
const fs = require('fs');

const generatePieChart = async (client, sender, labels, data, title) => {
    const ChartjsNode = require('chartjs-node');
    const chartNode = new ChartjsNode(800, 600);
  
    const chartConfig = {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#95a5a6'],
          },
        ],
      },
      options: {
        title: {
          display: true,
          text: title,
          fontSize: 18,
          fontColor: 'black',
        },
      },
    };
  
    const chartBuffer = await chartNode.drawChart(chartConfig);
    await chartNode.getImageBuffer('image/png'); // Ensure the chart is fully rendered
  
    await chartNode.destroy(); // Clean up the chart node
  
    await client.sendImage(sender, chartBuffer, title);
  };

  const generateBarChart = async (client, sender, labels, data, title, barColors) => {
    const ChartjsNode = require('chartjs-node');
    const chartNode = new ChartjsNode(800, 600);
  
    const chartConfig = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: barColors,
          },
        ],
      },
      options: {
        title: {
          display: true,
          text: title,
          fontSize: 18,
          fontColor: 'black',
        },
      },
    };
  
    const chartBuffer = await chartNode.drawChart(chartConfig);
    await chartNode.getImageBuffer('image/png'); // Ensure the chart is fully rendered
  
    await chartNode.destroy(); // Clean up the chart node
  
    await client.sendImage(sender, chartBuffer, title);
  };

  


async function generateAnalyticsReport(DB) {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    // Função para obter dados de acesso
    async function getAccessData() {
      return await DB.Message.findAll({
        attributes: [
          [DB.sequelize.fn('DATE', DB.sequelize.col('timestamp')), 'date'],
          [DB.sequelize.fn('COUNT', DB.sequelize.fn('DISTINCT', DB.sequelize.col('sender'))), 'count']
        ],
        where: {
          timestamp: {
            [Sequelize.Op.between]: [sevenDaysAgo, today],
          },
        },
        group: [DB.sequelize.fn('DATE', DB.sequelize.col('timestamp'))],
        raw: true,
      });
    }

    // Função para gerar gráfico de barras
    async function generateBarChartWithCheck(labels, data, title, barColors, type) {
      if (type) {
        if (data.length < 7) {
          console.log('⚠️ Não há dados suficientes para gerar o gráfico de atendimentos por dia.');
        } else {
          await generateBarChart(labels, data, title, barColors);
        }
      } else {
        await generateBarChart(labels, data, title, barColors);
      }
    }

    // Função para gerar gráfico de pizza
    async function generatePieChartWithCheck(labels, data, title) {
      if (data.length === 0) {
        console.log('⚠️ Não há dados suficientes para gerar o gráfico.');
      } else {
        await generatePieChart(labels, data, title);
      }
    }

    // Obter dados de acesso
    const accessData = await getAccessData();

    // Gerar gráfico de atendimentos por dia
    const labels = accessData.map(entry => {
      const date = new Date(entry.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });
    const data = accessData.map(entry => entry.count);
    const title = 'Atendimentos por Dia - AutoAtende';
    const barColors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];
    await generateBarChartWithCheck(labels, data, title, barColors, true);

    today.setHours(0, 0, 0, 0);

    // Obter dados de atendimentos por hora
    const frequentTimes = await DB.Message.findAll({
      attributes: [
        [Sequelize.fn('HOUR', Sequelize.col('timestamp')), 'hour'],
        [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('sender'))), 'count']
      ],
      where: {
        timestamp: {
          [Op.gte]: today,
          [Op.lt]: new Date(today.getTime() + 12 * 60 * 60 * 1000), // Buscar um período de 12 horas
        },
      },
      group: [
        Sequelize.fn('HOUR', Sequelize.col('timestamp'))
      ],
      order: [
        [Sequelize.fn('HOUR', Sequelize.col('timestamp')), 'ASC']
      ],
      raw: true
    });

    // Verifique se passaram mais de 4 horas desde o início do turno
    const currentTime = new Date();
    const timeDifferenceInHours = (currentTime - today) / (1000 * 60 * 60);

    if (timeDifferenceInHours > 4) {
      // Gerar gráfico de atendimentos por hora
      const labels1 = Array.from({ length: 12 }, (_, i) => `${i}:00`); // Gerar rótulos de 0:00 a 11:00
      const data1 = Array.from({ length: 12 }, () => 0); // Inicializar dados para cada hora como 0

      frequentTimes.forEach((timeData) => {
        // Preencher os dados com a contagem correspondente para cada hora
        const hour = timeData.hour;
        data1[hour] = timeData.count;
      });

      const title1 = 'Atendimentos por Hora - AutoAtende';
      const barColors1 = ['rgba(75, 192, 192, 0.8)', 'rgba(192, 75, 192, 0.8)', 'rgba(192, 192, 75, 0.8)'];
      await generateBarChart(labels1, data1, title1, barColors1);
    } else {
      console.log('⚠️ Não passaram mais de quatro horas desde o início do turno. Aguarde um pouco para gerar o gráfico.');
    }

    // Obter dados de utilização de comandos
    const messageCounts = await DB.Message.findAll({
      attributes: [
        'body',
        [DB.sequelize.fn('COUNT', DB.sequelize.col('body')), 'quantidade'],
      ],
      where: {
        body: {
          [Op.regexp]: '^[1-8]$',
        },
      },
      group: 'body',
      raw: true
    });
    const commandMapping = {
      1: 'Horários de Funcionamento',
      2: 'Cardápio',
      3: 'Nossa Localização',
      4: 'Tempo para Entregar',
      5: 'Fazer um Pedido',
      6: 'Opções de Pagamento',
      7: 'Opções de Consumo/Entrega',
      8: 'Falar com um Atendente',
    };
    const labels2 = [];
    const data2 = [];
    messageCounts.forEach(result => {
      labels2.push(commandMapping[result.body]);
      data2.push(result.quantidade);
    });
    const title2 = 'Utilização dos Comandos - AutoAtende';
    await generatePieChartWithCheck(labels2, data2, title2);

    // Obter dados de tempos médios de resposta
    const responseTimes = await DB.ResponseTimes.findAll({
      attributes: [
        'sender',
        [DB.sequelize.fn('AVG', DB.sequelize.col('responseTime')), 'avgResponseTime'],
      ],
      group: ['sender'],
      raw: true,
    });

    if (responseTimes.length > 0) {
      // Ordenar os registros com base no tempo médio em ordem decrescente
      responseTimes.sort((a, b) => parseFloat(b.avgResponseTime) - parseFloat(a.avgResponseTime));

      // Pegar os 5 tempos mais lentos
      const topResponseTimes = responseTimes.slice(0, 5);

      // Criar os dados para o gráfico
      const data3 = {};
      const labels3 = [];
      topResponseTimes.forEach((item, index) => {
        // Use um rótulo genérico para a coluna
        data3[`Coluna ${index + 1}`] = parseFloat(item.avgResponseTime);
        // Crie uma legenda associando números de celular a números de coluna
        labels3.push(`Celular ${index + 1}`);
      });

      const avgResponseTimes = Object.values(data3);
      const title3 = 'Top 5 Tempos Médios de Resposta por Remetente - AutoAtende';
      await generateBarChart(labels3, avgResponseTimes, title3, barColors);
    } else {
      console.error('Nenhum dado retornado pela consulta de tempos de resposta.');
    }

    // Consulta para obter a contagem de atendimentos por mês, considerando contatos únicos
    const monthlyCounts = await DB.Message.findAll({
      attributes: [
        [DB.sequelize.fn('DATE_FORMAT', DB.sequelize.col('timestamp'), '%Y-%m'), 'month'],
        [DB.sequelize.fn('COUNT', DB.sequelize.fn('DISTINCT', DB.sequelize.col('sender'))), 'count']
      ],
      group: [DB.sequelize.fn('DATE_FORMAT', DB.sequelize.col('timestamp'), '%Y-%m')],
      raw: true,
    });

    if (monthlyCounts.length > 0) {
      // Mapear os resultados para extrair os dados necessários
      const months = []; // Para armazenar os meses em português
      const counts = []; // Para armazenar a contagem de atendimentos

      // Mapear os resultados e converter o formato da data para o mês em português
      monthlyCounts.forEach((item) => {
        const dateParts = item.month.split('-');
        const monthNumber = parseInt(dateParts[1]);
        const monthName = moment().locale('pt-BR').month(monthNumber - 1).format('MMMM'); // Converter o número do mês para o nome do mês em português
        const formattedMonth = `${monthName}`;

        months.push(formattedMonth);
        counts.push(item.count);
      });

      const title4 = 'Atendimentos por Mês - AutoAtende';
      await generateBarChart(months, counts, title4, barColors);
    } else {
      console.error('Nenhum dado retornado pela consulta de atendimentos mensais.');
    }

    // Consulta para calcular a taxa de conversão
    const orderCount = await DB.Message.count({
      where: {
        body: '5' // Mensagens com body igual a 5 representam pedidos
      }
    });

    // Consulta para contar o número de números de telefone únicos na tabela `contacts` que têm pedidos
    const uniqueNumbersWithOrdersCount = await DB.Contacts.count({
      where: {
        whatsappNumber: {
          [Sequelize.Op.in]: Sequelize.literal(`(SELECT DISTINCT sender FROM messages WHERE body = '5')`) // Subconsulta para obter os números únicos que fizeram pedidos
        }
      }
    });

    // Calcular a taxa de conversão
    const conversionRate = (uniqueNumbersWithOrdersCount / orderCount) * 100;

    // Arredondar a taxa de conversão para duas casas decimais
    const roundedConversionRate = conversionRate.toFixed(2);

    // Criar um gráfico de pizza para mostrar a taxa de conversão
    const title5 = `Taxa de Conversão de Pedidos: ${roundedConversionRate}% - AutoAtende`;
    const labels4 = ['Menu 5: Fazer Pedido', 'Pedidos Feitos'];
    const data4 = [orderCount, uniqueNumbersWithOrdersCount];
    const pieColors2 = ['#3498db', '#27ae60']; // Cores para os setores do gráfico de pizza
    await generatePieChart(labels4, data4, title5, pieColors2);
  } catch (error) {
    console.error('Erro ao gerar relatório de análise:', error);
  }
}

// Chame a função para gerar o relatório
generateAnalyticsReport(DB);
