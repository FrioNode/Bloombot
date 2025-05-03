async function pokemon() {
    const randomId = Math.floor(Math.random() * 898) + 1;
    const url = `https://pokeapi.co/api/v2/pokemon/${randomId}/`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch Pokémon');

        const pokemon = await response.json();
        //   console.log('Pokemon Data:', pokemon);
        const pokemonName = pokemon.name;
        const pokemonImage = pokemon.sprites.front_default;
        const pokemonHeight = pokemon.height;
        const pokemonWeight = pokemon.weight;

        const speciesUrl = pokemon.species.url;
        const speciesResponse = await fetch(speciesUrl);
        const speciesData = await speciesResponse.json();
        //   console.log('Species Data:', speciesData);
        const pokemonDescription = speciesData.flavor_text_entries
        .find(entry => entry.language.name === 'en')?.flavor_text || 'No description available';
        const cleanedDescription = pokemonDescription
        .replace(/\f/g, ' ')
        .replace(/\n/g, ' ');

        const pokemonDetails = {
            name: pokemonName,
            image: pokemonImage,
            height: pokemonHeight,
            weight: pokemonWeight,
            description: cleanedDescription
        };

        return pokemonDetails;

    } catch (error) {
        console.error('Error fetching Pokémon:', error); // Log the error
        return null; // In case of an error, return null
    }
}

module.exports = { pokemon }