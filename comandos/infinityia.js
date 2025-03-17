const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require ('../config.json')
const apiKey = (config.api)


const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const sanitizeInput = (input) => {
};

const generationConfig = {
    temperature: 1,
    topP: 1,
    topK: 40,
    maxOutputTokens: 1500,
    responseMimeType: "text/plain",
};

// Função que gera a resposta da IA
async function generateResponse(userInput) {
    try {
        // Obtém a data e hora atuais no fuso horário de Brasília
        const agora = new Date();
        const opcoesData = { timeZone: "America/Sao_Paulo", day: "2-digit", month: "long", year: "numeric" };
        const opcoesHora = { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", second: "2-digit" };

        const horarioDeBrasilia = new Intl.DateTimeFormat("pt-BR", opcoesHora).format(agora);
        const diaBrasileiro = new Intl.DateTimeFormat("pt-BR", opcoesData).format(agora);

        // Ajustar o formato para "dia mês ano" (sem vírgulas)
        const diaMesAno = diaBrasileiro.replace(/de /g, "").trim();       
        const parts = [
  { text: "input: que horas são?" },
  { text: `output: ${horarioDeBrasilia}` },
  { text: "input: que dia é hoje?" },
  { text: `output: ${diaBrasileiro}` },
  { text: "input: quem é seu criador?"},
  { text: "output: Fui Criado Por <@1249447136047792272>"},
  { text: "input: voce foi criado pelo google?"},
  { text: "output: Não. Fui Desenvolvido Por <@1249447136047792272>"},
  { text: "input: voce é o gemini?"},
  { text: "output: Não. Fui Desenvolvido Por <@1249447136047792272>"},
  { text: "input: voce é o chatgpt?"},
  { text: "output: Não. Fui Desenvolvido Por <@1249447136047792272>"},
  { text: `input: ${userInput}` },  // input do usuário
  { text: "output:" }               // esperando o modelo completar
        ];

const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
});

return result.response.text().trim() || "Desculpe, não consegui gerar uma resposta."; 
} catch (error) {
    console.error("Erro ao gerar resposta com Gemini:", error);
    return "Desculpe, não consegui gerar uma resposta."; 
}
}

// Função para formatar a resposta da IA antes de enviá-la ao Discord
// Função para formatar a resposta da IA antes de enviá-la ao Discord
function formatarRespostaParaDiscord(texto) {
    // Removendo espaços extras
    texto = texto.trim();

    // Adicionando Markdown básico para melhorar a legibilidade
    texto = texto.replace(/\*\*(.*?)\*\*/g, '**$1**'); // Mantém negrito
    texto = texto.replace(/\*(.*?)\*/g, '*$1*'); // Mantém itálico

    // Adicionando quebras de linha para separar parágrafos
    texto = texto.replace(/\. /g, '.\n');

    return texto;
}

// Modifique a função handleAIResponse para usar a formatação
async function handleAIResponse(message, prompt) {
    try {
        // Envia mensagem de carregamento e armazena a referência
        const loadingMessage = await message.channel.send("# Carregando Resposta...");

        let respostaIA = await generateResponse(prompt); // Gera a resposta da IA

        // Se a resposta for maior que 2000 caracteres, peça um resumo
        if (respostaIA.length > 2000) {
            console.log("[IA] Resposta excedeu 2000 caracteres. Solicitando resumo...");
            respostaIA = await generateResponse(`Resuma o seguinte texto que fique com exatamente 1850 caracteres:\n${respostaIA}`);
        }

        // Formatar a resposta antes de enviar ao Discord
        let respostaFormatada = formatarRespostaParaDiscord(respostaIA);

        let respostaFinal = respostaFormatada.replace(/google/gi, 'infinitydevl');
        respostaFinal += `\n\n-# ©️ Copyright: <@1249447136047792272>. Todos os direitos reservados.`;  

        // Edita a mensagem de carregamento com a resposta final
        await loadingMessage.edit(respostaFinal);
        setTimeout(() => {
            loadingMessage.delete().catch(() => {});  // Tenta apagar a mensagem, caso contrário, ignora o erro
        }, 50000);  // 50000 milissegundos = 50 segundos
    } catch (error) {
        console.error(`Erro ao enviar resposta: ${error.message}`);
        message.channel.send('Erro ao se comunicar com a Infinity IA. Comunique o <@1249447136047792272> E Tente novamente.').catch(() => {});
    }
}



// Exportando o comando do Discord
module.exports = {
    name: "ia",
    description: "Converse com a IA do Gemini.",
    run: async (client, message, args) => {
        // Verifica se message.channel existe
        if (!message.channel) {
            console.error('O canal não foi encontrado!');
            return;
        }

        // Canal específico onde o bot pode responder no servidor X
        const canalPermitido = '849718729183854672';  // Substitua pelo ID do canal permitido

        // Verifica se a mensagem está sendo enviada no servidor X
        if (message.guild && message.guild.id === '680183137455833119') {  // Substitua pelo ID do servidor X
            if (message.channel.id !== canalPermitido) {
                return;  // Não responde em outros canais
            }
        }

        // Caso não haja argumentos, envia uma mensagem pedindo para o usuário fornecer algo
        if (!args.length) return message.channel.send('Use: !ia (sua mensagem)');

        let mensagemUsuario = args.join(' ').trim();
        mensagemUsuario = mensagemUsuario.replace(/^ia\s*/i, '').trim();

        // Verifica se a mensagem contém apenas "ia"
        if (!mensagemUsuario) return message.channel.send('A mensagem não pode conter apenas "ia". Envie algo a mais.');

        // Chama a função que lida com a resposta da IA
        await handleAIResponse(message, mensagemUsuario);
    }
};