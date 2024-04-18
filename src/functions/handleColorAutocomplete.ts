import { AutocompleteInteraction, Colors } from "discord.js";

export async function handleColorAutocomplete(
  interaction: AutocompleteInteraction
) {
  const focused = interaction.options.getFocused();
  const colors = Object.keys(Colors);
  const filteredColors = colors.filter((color) =>
    color.toLocaleLowerCase().startsWith(focused.toLocaleLowerCase())
  );
  await interaction.respond(
    filteredColors
      .slice(0, 25)
      .map((status) =>
        status != "Default"
          ? { name: status, value: status }
          : { name: "Black", value: status }
      )
  );
};