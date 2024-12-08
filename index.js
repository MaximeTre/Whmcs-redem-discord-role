const { Client, GatewayIntentBits, Collection, InteractionType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const ClientWhmcs = require("whmcs-api")

let init = {
    // Specifying API.php Endpoint
    "endpoint": process.env.WHMCS_SERVER_URL,
    // Authentication
    "identifier": process.env.WHMCS_API_IDENTIFIER,
    "secret": process.env.WHMCS_API_SECRET,
    // OR
    "username": process.env.WHMCS_USERNAME,
    "password": process.env.WHMCS_PASSWORD,
    // Other Required Parameters.
    "accesskey": process.env.WHMCS_ACCESS_KEY,
    "responsetype":"json" // Change this to break the module :-)
  }

const whmcs = new ClientWhmcs(init)

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

function clientSearch(email) {
    return whmcs.call("GetUsers", {
        limitnum: "1",
        search: email
    });
}

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
}

client.once('ready', () => {
    console.log(`${client.user.tag} est en ligne !`);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Une erreur est survenue lors de l\'exécution de cette commande.', ephemeral: true });
        }
    }

    if (interaction.isButton() && interaction.customId === 'openModal') {

        const modal = new ModalBuilder()
            .setCustomId('emailModal')
            .setTitle('Entrer votre email');

        const emailInput = new TextInputBuilder()
            .setCustomId('emailInput')
            .setLabel('Votre email')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('exemple@domaine.com')
            .setRequired(true);

        const modalRow = new ActionRowBuilder().addComponents(emailInput);

        modal.addComponents(modalRow);

        await interaction.showModal(modal);
    }

    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'emailModal') {
        const email = interaction.fields.getTextInputValue('emailInput');
    
        try {
            const data = await clientSearch(email); // Attendre le résultat
            console.log(data);
    
            if (data?.numreturned >= 1) {
                if (interaction.member.roles.cache.has(process.env.CLIENT_ROLE_ID)) {
                    await interaction.reply({
                        content: `Vous avez deja le role client.`,
                        ephemeral: true
                    });
                } else {
                    interaction.member.roles.add(process.env.CLIENT_ROLE_ID)
                    await interaction.reply({
                        content: `Félicitations, **${data.users[0].firstname}** 🎉 ! Vous avez désormais le rôle de client sur notre serveur. Bienvenue parmi nous et merci de votre confiance !`,
                        ephemeral: true
                    });
                }
            } else {
                await interaction.reply({
                    content: `Aucun utilisateur trouvé avec cet email. Veuillez créer un compte ici : https://my.justmyhost.fr/register.php `,
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Erreur lors de la recherche client:', error);
            await interaction.reply({
                content: `Une erreur s'est produite lors de la recherche de l'utilisateur.`,
                ephemeral: true
            });
        }
    }
});

client.login(process.env.BOT_TOKEN);
