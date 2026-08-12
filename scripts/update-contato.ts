import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  const mainContent = await prisma.siteContent.findUnique({ where: { id: "main" } });
  
  if (mainContent) {
    const data = mainContent.data as any;
    
    // Update contato section
    data.contato.heroTitle = "SEJA UM *APOIADOR*";
    data.contato.heroLead = "Sua participação é fundamental. Preencha o formulário abaixo para se tornar um apoiador, enviar sugestões ou conversar com a nossa equipe.";
    
    await prisma.siteContent.update({
      where: { id: "main" },
      data: { data }
    });
    console.log("Database updated successfully.");
  } else {
    console.log("No main content found in database.");
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
