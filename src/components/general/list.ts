import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, MessageOptions } from "discord.js";
import { ButtonComponent } from "../messages/button";
import { FreeComponent } from "./free";

export interface CreateListProps<TCustomData> {
  page?: number;
  customData: TCustomData;
}

export interface ListData {
  currentPage: number;
}

export interface ListButtonCustomData<TCustomData> extends ListData {
  customData: TCustomData;
}

export interface ListRunnerData<TCustomData> {
  currentPage: number;
  maxPage?: number;
  customData?: TCustomData;
}

export interface ListRunnerResult {
  embed: EmbedBuilder;
  updateCurrentPage?: number;
  updateMaxPage?: number;
}

export type ListRunner<TCustomData> = (data: ListButtonCustomData<TCustomData>) => Promise<ListRunnerResult>;

export class ListComponent<TCustomData> extends FreeComponent {
  runner: ListRunner<TCustomData>;

  next: ButtonComponent<ListButtonCustomData<TCustomData>>;
  previous: ButtonComponent<ListButtonCustomData<TCustomData>>;

  async create(customData: TCustomData, page?: number): Promise<MessageOptions> {
    let currentPage = page ?? 1;
    const {embed, updateCurrentPage, updateMaxPage} = await this.runner({currentPage, customData});

    if (updateCurrentPage) currentPage = updateCurrentPage;

    const data: ListButtonCustomData<TCustomData> = {customData, currentPage};

    const next = await this.next.create(data);

    if (updateMaxPage && currentPage >= updateMaxPage) next.setDisabled(true);

    const previous = await this.previous.create(data);

    if (currentPage === 1) previous.setDisabled(true);

    return {
      embeds: [embed],
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
        next,
        previous,
      )],
    };
  }


  constructor(runner: ListRunner<TCustomData>) {
    const next: ButtonComponent<ListButtonCustomData<TCustomData>> = new ButtonComponent(async ({interaction, customData: data}) => {
      await interaction.deferUpdate();

      const {customData} = data;
      let {currentPage} = data;

      currentPage += 1;

      await interaction.editReply(await this.create(customData, currentPage));
    }, {
      label: "Next",
    });
  
    const previous: ButtonComponent<ListButtonCustomData<TCustomData>> = new ButtonComponent(async ({interaction, customData: data}) => {
      await interaction.deferUpdate();

      const {customData} = data;
      let {currentPage} = data;

      currentPage -= 1;

      await interaction.editReply(await this.create(customData, currentPage));
    }, {
      label: "Previous",
    });
    
    super(
      next,
      previous,
    );

    this.next = next;
    this.previous = previous;

    this.runner = runner;
  }
}