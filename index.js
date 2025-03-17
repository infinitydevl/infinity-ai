const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs').promises;
const path = require('path');
const { ActivityType } = require('discord.js-selfbot-v13');

const loadConfig = async () => {
    const data = await fs.readFile('config.json', 'utf-8');
    return JSON.parse(data);
};

const client = new Client();

client.commands = new Map();


let prefix;


const loadCommands = async () => {
    const commandFiles = await fs.readdir(path.join(__dirname, 'comandos'));
    const loadPromises = commandFiles
        .filter(file => file.endsWith('.js'))
        .map(async (file) => {
            const command = require(path.join(__dirname, 'comandos', file));
            if (command.name) {
                if (typeof command.run !== 'function') {
                    console.warn(`Comando ${command.name} carregado, mas NÃO tem função run!`);
                    return;
                }
                client.commands.set(command.name, command);
                console.log(`Comando carregado: ${command.name}`);
            }
        });
    await Promise.all(loadPromises);
};


client.once('ready', async () => {

    await loadCommands(); // Carregar os comandos
        console.clear();
        console.log(`⚡️ | Logado como: ${client.user.tag}\n`);
        console.log(`⚡️ | Estou em: ${client.guilds.cache.size} servidores!\n`);
        console.log(`⚡️ | Acesso a ${client.channels.cache.size} canais!\n`);
        console.log(`⚡️ | Contendo ${client.guilds.cache.reduce((a, b) => a + b.memberCount, 0)} Amiguinhos!\n`);

        setInterval(() => {
            client.user.setPresence({
                activities: [{
                    name: '🧡 | Infinity IA',
                    type: 'STREAMING', 
                    url: 'https://www.twitch.tv/discord'
                }],
                status: 'idle'
            });
        }, 4000);
    });


const startBot = async () => {
    const config = await loadConfig();
    prefix = config.prefix; 
    const { token } = config;

    await client.login(token); 
    console.log('Bot logado com sucesso!');

    
    client.on('messageCreate', async (message) => {
        if (!message.content.startsWith(prefix) || message.author.bot) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.commands.get(commandName);

        if (!command) return;

        try {
            console.log(`Comando recebido de ${message.author.username} (${message.author.id}): ${message.content}`);
            await command.run(client, message, args);
        } catch (error) {
            console.error(`Erro ao executar o comando ${commandName}: ${error.message}`);
        }
    });
};

startBot().catch(console.error);