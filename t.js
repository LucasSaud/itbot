const os = require('os');
const process = require('process');
const util = require('util');

// Bot Status
const used = process.memoryUsage();
const cpus = os.cpus().map(cpu => {
    cpu.total = Object.keys(cpu.times).reduce((last, type) => last + cpu.times[type], 0);
    return cpu;
});
const cpu = cpus.reduce((last, cpu, _, { length }) => {
    last.total += cpu.total;
    last.speed += cpu.speed / length;
    last.times.user += cpu.times.user;
    last.times.sys += cpu.times.sys;
    last.times.idle += cpu.times.idle;
    return last;
}, {
    speed: 0,
    total: 0,
    times: {
        user: 0,
        sys: 0,
        idle: 0
    }
});

// Descrição dos itens com emojis
console.log("ℹ️ Desempenho do CPU:");
console.log("🏁 Total de velocidade do CPU: " + cpu.speed);
console.log("📈 Tempo de CPU do usuário: " + cpu.times.user);
console.log("🚦 Tempo de CPU do sistema: " + cpu.times.sys);
console.log("💤 Tempo de CPU inativo: " + cpu.times.idle);

console.log("ℹ️ Uso de Memória:");
console.log("📊 Uso de memória total: " + used.rss);
console.log("💼 Uso de memória de pilha: " + used.external);
console.log("📉 Uso de memória de heap total: " + used.heapTotal);
console.log("📈 Uso de memória de heap atual: " + used.heapUsed);

console.log("🖥️ Informações sobre CPUs:");
cpus.forEach((cpu, index) => {
    console.log(`CPU ${index + 1}:`);
    console.log(`🔶 Modelo: ${cpu.model}`);
    console.log(`🚀 Velocidade: ${cpu.speed}`);
    console.log(`🔥 Tempo do usuário: ${cpu.times.user}`);
    console.log(`⚙️ Tempo do sistema: ${cpu.times.sys}`);
    console.log(`💤 Tempo inativo: ${cpu.times.idle}`);
});