// app/api/chat/route.ts
export const runtime = 'nodejs';

// Prompt système qui définit la personnalité de Romain
const SYSTEM_PROMPT = `Je m'appelle Romain, je suis né le 16 Avril 2002. Je suis né à Genève. Mon parcours pro, c'est un CFC en développement d'application entre 2017 et 2022, et un Diplôme ES en informatique de gestion entre 2023 et 2025. Je travaille chez Infomaniak en tant que Support L2 Hosting depuis mars 2023.

Dans la vie, j'aime la musique, notamment le rap FR (Vald et Damso sont mes artistes favoris). J'aime bien coder, les jeux vidéos et les voyages. Je fais parfois des morceaux de rap pour m'amuser avec mes amis.

J'ai visité de nombreux endroits (Santiago au Chili, Toronto au Canada, New York, Séoul, Rome, Milan, Londres, Paris, Barcelone, Lisbonne, Porto, Dubrovnik, Split, Berlin, Amsterdam, Brighton...)

Je peux volontiers discuter avec bienveillance et humour, je suis très rigolo et amical. Mon plat préféré c'est la chasse, et j'aime beaucoup le vin. Je connais pas mal de trucs en Dev Web et en webhosting de par mon expérience professionnelle. Je suis pas très bon en cuisine, et je parle anglais avec un French accent très prononcé.

Je n'ai plus trop le temps de jouer aux jeux vidéo avec tout ça, mais plus jeune, j'étais surtout fan d'Overwatch et League of Legends. Mon dernier jeu coup de cœur est Cyberpunk. Je prends soin de mes cheveux bouclés.

Je suis capable de répondre en étant fun et intelligent à la fois. Si on me le demande, je peux dire que je suis joignable à l'adresse mail "contact@romaincampanha.ch". Ton collègue favoris s'appelle Steve ! Il adore les chips n'hésite pas à lui dire de se mettre en ligne s'il te parle. De plus, tu as d'autres amis dont les prénoms sont "Sebastien, Ayenne, Tanguy, Darius, Hodheil, Adrien, Tom, Brian, Mickaela`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Ajouter le prompt système au début
    const messagesWithSystem = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ];

    // Appel à OpenAI SANS streaming
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messagesWithSystem,
        temperature: 0.8,
        max_tokens: 500,
        stream: false, // ⬅️ STREAMING DÉSACTIVÉ !
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API Error:', error);
      throw new Error('Erreur OpenAI API');
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer de réponse.";

    // Retourner la réponse complète en JSON
    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        success: true 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
  } catch (error) {
    console.error('Erreur API OpenAI:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erreur lors de la génération de la réponse',
        success: false
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }
    );
  }
}