import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder, MessageOptions } from "discord.js";
import { CustomDataContext, InteractionContext, Runner } from "../runnerComponent";
import { ButtonComponent } from "../messages/button";
import { FreeComponent } from "./free";

interface ConfirmContext<TCustomData> extends CustomDataContext<ButtonInteraction, TCustomData> {
  confirm: boolean;
}

/** Component which shows a confirm dialog and then runs the provided runner. */
export class ConfirmComponent<TCustomData> extends FreeComponent {
  private runner: Runner<ButtonInteraction, ConfirmContext<TCustomData>>;

  title: string;
  description: string;

  yes: ButtonComponent<TCustomData>;
  no: ButtonComponent<TCustomData>;

  async create(customData: TCustomData): Promise<MessageOptions> {
    const embed = new EmbedBuilder().addFields({
      name: this.title,
      value: this.description
    });
    
    const [yes, no] = await Promise.all([
      this.yes.create(customData),
      this.no.create(customData),
    ]);

    return {
      embeds: [embed],
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
        yes,
        no,
      )],
    };
  };


  constructor(runner: Runner<ButtonInteraction, ConfirmContext<TCustomData>>, data: {
    title: string;
    description: string;
  }) {
    const yes: ButtonComponent<TCustomData> = new ButtonComponent(async ({interaction, customData}) => {
      await this.runner({interaction, confirm: true, customData});
    }, {
      label: "Yes",
    });
  
    const no: ButtonComponent<TCustomData> = new ButtonComponent(async ({interaction, customData}) => {
      await this.runner({interaction, confirm: false, customData});
    }, {
      label: "No",
    });
    
    super(yes, no);

    this.title = data.title;
    this.description = data.description;

    this.yes = yes;
    this.no = no;
    this.runner = runner;
  }
}