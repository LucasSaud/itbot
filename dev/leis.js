const leis = {
    "Lei 1 – Nunca ofusque o mestre": "Sempre faça aqueles acima de você se sentirem confortavelmente superiores. Não faça nada que os deixem inseguros. Para conquistar o poder, você precisa que eles pareçam melhores e mais brilhantes do que eles realmente são.",
    "Lei 2 – Nunca confie demais em seus amigos, aprenda como usar os inimigos": "Segundo o autor Robert Greene, as chances dos seus amigos te traírem são maiores. Eles têm uma tendência lamentável de esperar muito de você, por causa de sua amizade, e se tornarem perturbações exigentes. Em vez de contratar amigos você deve contratar inimigos. O inimigo que você perdoa sempre sentirá que ele tem que provar sua lealdade. Se você não tem inimigos, comece a trabalhar e faça alguns bons.",
    "Lei 3 – Não mostre suas intenções": "Se as pessoas não sabem qual objetivo você está buscando, elas não podem se defender contra você. Mantenha suas intenções em segredo. Para ter poder, você precisa ser capaz de deixar as pessoas perdidas e desinformadas.",
    "Lei 4 – Sempre fale menos que o necessário": "Os poderosos raramente falam. Quanto mais você fala, mais comum se torna. Ao se tornar comum, menos impressionante você parece. Fale com moderação. É importante que você seja vago e fale o mínimo possível. Quem fala pouco parece mais poderoso e intimida as pessoas com sua discrição.",
    "Lei 5 – Muitas coisas dependem da sua reputação, guarde-a com sua vida": "Sua reputação é a base do seu poder. Quanto mais reconhecido e respeitado você é, mais poderoso você se torna, mas uma vez danificada ela se torna inútil. Ter apenas uma boa reputação já te ajuda a vencer. Agora, se você deseja destruir seus inimigos, ataque a reputação deles. Feito o ataque, saia de perto e deixe que o público termine a desmoralização dos seus oponentes.",
    "Lei 6 – Torne-se o centro das atenções": "As pessoas são julgadas pela sua aparência e, se você quer ter poder, atraia sempre a atenção das pessoas e nunca fique invisível na multidão. Seja misterioso, mas destaque-se da massa.",
    "Lei 7 – Faça os outros trabalharem para você, mas sempre pegue o crédito": "Segundo a explicação dada pelo autor Robert Greene em seu livro, “As 48 Leis do Poder”, se você quer se tornar poderoso, precisa levar os créditos pelo trabalho das pessoas que trabalham para você e, sempre que possível, aproprie-se dos méritos das atividades que elas executarem. Ao fazer isso você parecerá um milagre de velocidade e competência, e ninguém se lembrará daqueles que tornaram possível o seu sucesso. Nunca faça você mesmo o que outras pessoas podem fazer para você.",
    "Lei 8 – Faça com que as pessoas venham até você, use uma isca se for necessário": "Ao forçar outras pessoas a agir, você fica no controle. É sempre melhor fazer seu oponente vir até você, dessa forma ele abandona seus próprios planos no processo. Ofereça iscas e promessas de grandes ganhos e, quando atraí-los, ataque.",
    "Lei 9 – Vença através de suas ações, não de argumentos": "De acordo com o autor Robert Greene, discussões geram ressentimentos para a pessoa do outro lado, o que prejudica sua capacidade de influenciar. Para vencer, você precisa tomar ações que mostrem o que você quer. Prove que você está certo através de atos, não de palavras.",
    "Lei 10 – Se afaste dos infelizes e azarados": "Estar próximo de pessoas infelizes e azaradas esgota sua capacidade mental e emocional, fazendo você falhar por contaminação. Evite-os, e se aproxime apenas dos vencedores.",
    "Lei 11 – Aprenda a manter as pessoas dependentes de você": "Quando as pessoas dependem de você, você está no controle. Nunca ensine a elas o necessário para pensarem que podem competir com você. Guarde alguns segredos que garantam seu poder.",
    "Lei 12 – Use a honestidade e a generosidade seletivas para desarmar a sua vítima": "Inicialmente, seja honesto e generoso, dessa forma as pessoas irão relaxar e começar a confiar em você. Isso as tornarão vulneráveis e seu poder crescerá. Ganhe a confiança da pessoa, antes de enganá-la. Dê presentes, assim como fizeram os gregos com o Cavalo de Tróia.",
    "Lei 13 – Ao pedir ajuda, apele pelo interesse próprio das pessoas, nunca pela compaixão ou gratidão": "Quando as pessoas são altruístas, você fica endividado. Normalmente, as pessoas não vão querer ajudá-lo de graça. Para conseguir ajuda, mostre o que a outra pessoa vai ganhar com isso. Assim você não se expõe e consegue atingir seu objetivo.",
    "Lei 14 – Banque o amigo, trabalhe como um espião": "Aproxime-se das pessoas e faça perguntas indiretas, com segundas intenções. Aproveite toda oportunidade que tiver para conseguir mais informações. Iluda as pessoas para parecer um amigo, ganhe confiança, e aprenda o máximo que puder.",
    "Lei 15 – Destrua completamente seu inimigo": "Todos os grandes líderes sabem que um inimigo temível deve ser totalmente aniquilado. Mas, às vezes eles aprendem isso do jeito difícil. Conforme aconselhado pelo autor Robert Greene, destrua-o de uma forma que ele não consiga se recuperar. Acabe com sua mente e espírito e nunca tenha piedade.",
    "Lei 16 – Aumente sua honra e seu respeito usando a ausência": "Quanto mais presente, menor o seu valor. Afaste-se de seu grupo e deixe que as pessoas percebam que você está longe. Isso aumenta seu valor por gerar escassez da sua presença. Coisas escassas são valiosas.",
    "Lei 17 – Mantenha os outros em um terror suspenso. Cultive um ar de imprevisibilidade": "Ser previsível não te dá poder, pelo contrário, apenas tira. Em vez disso, comporte-se de forma imprevisível e inconsistente. Fazendo isso, as pessoas pararão de tentar ler seus movimentos. Quanto mais imprevisível, mais intimidadas e aterrorizadas as pessoas ficarão em relação ao seu próximo passo.",
    "Lei 18 – Não construa uma fortaleza para se proteger, se isolar é perigoso": "O mundo é um lugar perigoso e inimigos aparecem de todos os lugares. Apesar de uma fortaleza parecer segura, ela te coloca ainda mais em perigo, pois te isola das informações importantes. Você deve ficar entre as pessoas, encontrar aliados, se misturar. Na multidão você está protegido dos seus inimigos.",
    "Lei 19 – Saiba com quem está lidando, não ofenda a pessoa errada": "Uma pessoa pode ficar anos nutrindo mágoas até ter a oportunidade de se vingar. Então, nunca deixe suas ofensas serem incompreendidas e chegarem até um alvo não planejado.",
    "Lei 20 – Não se comprometa com ninguém": "É tolice tomar lados em uma discussão. Sua preocupação deve ser jogar as pessoas umas contra as outras e fazer com que elas te sigam. Tenha em mente que seu único compromisso é com você mesmo. Evite aliados inseparáveis.",
    "Lei 21 – Banque o bobo": "Ninguém gosta de se sentir estúpido perto de outras pessoas. Então, o truque é fazer suas vítimas parecerem inteligentes, especificamente, mais espertas que você. Dessa forma, elas jamais pensarão que você tem outras intenções.",
    "Lei 22 – Use a tática da rendição: transforme a fraqueza em poder": "Se for mais fraco que seu oponente, desista de lutar. Não dê a seu oponente a satisfação de derrotar você. Renda-se e negocie os termos para manter o máximo poder possível. Espere por um passo em falso do seu oponente e ataque sem levantar suspeitas.",
    "Lei 23 – Concentre suas forças": "Escolha um ponto e concentre todas as suas forças nele. Não ataque múltiplas coisas ao mesmo tempo. A intensidade sempre vence a dispersão.",
    "Lei 24 – Encene o bajulador perfeito": "O autor Robert Greene informa em seu livro, “As 48 Leis do Poder”, que o bajulador se sente à vontade num mundo em que tudo gira ao redor de poder e habilidade política. Ele é bem visto e consegue agregar poder sem esforço. Se você deseja controlar até mesmo o rei, seja o bajulador perfeito.",
    "Lei 25 – Renove-se": "Recrie você mesmo, forjando uma nova identidade, uma que chame a atenção e nunca deixe a audiência entediada. Use o teatro em suas ações e discursos. Isso cria um personagem interessante e amado pelas pessoas.",
    "Lei 26 – Mantenha suas mãos limpas": "Use alguém para fazer qualquer trabalho sujo por você. Se as coisas se complicarem, encontre alguém para assumir a culpa. Bodes expiatórios são muito úteis.",
    "Lei 27 – Jogue com a necessidade das pessoas de acreditar em alguma coisa para criar um séquito de devotos": "Pessoas têm uma necessidade de acreditar em algo. Beneficie-se disso e ofereça a elas algo para confiar, alguém para seguir. Leve seus discípulos a sacrificarem-se por você e fortalecerem sua posição.",
    "Lei 28 – Entre em ação com ousadia": "A dica do livro “As 48 Leis do Poder” é: se você está com dúvidas quanto a determinada atitude, não faça. Sua insegurança e hesitação irão limitar sua eficácia. Entre em ação com fé e chame a atenção. Todos admiram o corajoso e audacioso; ninguém honra os medrosos.",
    "Lei 29 – Planeje cada passo até o fim": "Não deixe nenhuma ponta solta. Planeje cada passo, sem depender da sorte. Muitos perderam o fruto de suas conspirações por não elaborarem bem a conclusão. Como resultado, outra pessoa recebeu o crédito, dinheiro ou poder.",
    "Lei 30 – Faça as suas conquistas parecerem fáceis": "Seus resultados devem parecer naturais e fáceis. Nunca mostre que precisou se dedicar para conquistar as coisas, e aparente ser capaz de fazer ainda mais. No entanto, não mostre a ninguém como você fez, ou suas estratégias serão usadas contra você.",
    "Lei 31 – Controle as opiniões, faça os outros jogarem com as cartas que você deu": "O autor Robert Greene aconselha: dê opções de escolha para as pessoas, mas certifique-se que escolham sempre o melhor para você. Faça suas vítimas sentirem que estão no controle, mas na verdade elas são suas marionetes.",
    "Lei 32 – Brinque com as fantasias das pessoas": "Segundo o livro “As 48 Leis do Poder”, a verdade deve ser evitada porque é feia e desagradável. Nunca apele para a verdade e a realidade a menos que você esteja preparado para a fúria que virá da desilusão. As pessoas querem romantizar suas vidas e, se você conseguir iludi-las nesta direção, será recompensado com poder.",
    "Lei 33 – Descubra as fraquezas de cada um": "Todos possuem pontos fracos e é seu dever saber explorá-las. Elas podem ser vulnerabilidades, inseguranças ou necessidades. Uma vez identificados, você pode usá-las para ter vantagens.",
    "Lei 34 – Aja como um rei para ser tratado como um": "Porte-se como um rei, pois parecer um plebeu vai te levar apenas a ser ignorado. Respeite e valorize a si mesmo. As pessoas o verão como você se vê.",
    "Lei 35 – Mestre na arte de pedir: “Vou te pedir um favor”": "Quando você pede um favor a alguém, você faz a pessoa se sentir importante e poderosa. Além disso, você obtém o que quer. Peça de uma forma que faça a pessoa sentir que ela está no comando.",
    "Lei 36 – Esteja sempre a par do que acontece ao seu redor": "Esteja ciente do que está acontecendo à sua volta, dos planos e intrigas dos outros. Seja o primeiro a perceber qualquer movimento hostil. O conhecimento é poder.",
    "Lei 37 – Crie desespero e agonia emocional": "Em uma briga de poder, a dor emocional é uma arma valiosa. Através dela, você pode manipular seu oponente, fazendo-o reagir de acordo com seus interesses. Crie desespero e agonia emocional para enfraquecê-lo.",
    "Lei 38 – Apenas celebre as vitórias": "As vitórias são sua oportunidade de celebrar e atrair mais atenção para você. Não perca tempo celebrando as vitórias dos outros, pois isso só te coloca em um papel secundário.",
    "Lei 39 – Pense como você quiser, mas aja como os outros": "Em sociedade, você deve seguir as convenções e expectativas. Você pode pensar de forma diferente, mas é importante agir de acordo com as normas sociais para evitar conflitos e evitar se destacar de maneira negativa.",
    "Lei 40 – Não cometa erros quando escolher: lei a personalidade do indivíduo, não a de sua profissão": "Ao escolher aliados, sócios e subordinados, lembre-se de que é a personalidade que importa, não a profissão. Mesmo se alguém for talentoso em sua área, se eles têm uma personalidade tóxica, podem ser prejudiciais para você.",
    "Lei 41 – Evite as pessoas infelizes e pouco sortudas": "Estar perto de pessoas infelizes e azaradas esgota sua capacidade mental e emocional, fazendo você falhar por contaminação. Evite-os, e se aproxime apenas dos vencedores.",
    "Lei 42 – Não confunda o prazer com a felicidade": "O prazer é momentâneo e muitas vezes prejudicial. A felicidade é duradoura e construtiva. Não confunda os dois e evite prazeres de curto prazo que possam prejudicar sua felicidade de longo prazo.",
    "Lei 43 – Saiba quando deixar as pessoas chegarem perto de você e quando não deixá-las: seja impenetrável": "Nunca deixe as pessoas se aproximarem demais de você, mas também não as afaste completamente. Seja impenetrável, mantenha sua guarda alta e revele apenas o necessário.",
    "Lei 44 – Jogue as pessoas umas contra as outras": "Divida e conquiste. Faça com que seus inimigos lutem entre si enquanto você assiste de lado. Isso enfraquece seus oponentes e fortalece sua posição.",
    "Lei 45 – Preste atenção aos detalhes": "Pequenos detalhes muitas vezes revelam grandes segredos. Esteja atento aos detalhes, pois eles podem fornecer informações valiosas e vantagens estratégicas.",
    "Lei 46 – Nunca pare de fazer inimigos": "Se você não tem inimigos, crie alguns. Ter inimigos mantém você alerta e em constante movimento. Eles também podem ser úteis para distrair seus oponentes.",
    "Lei 47 – Não vá além da qualidade, a quantidade tem uma qualidade própria": "Foco na qualidade é importante, mas às vezes a quantidade tem sua própria qualidade. Não se estenda muito em busca de perfeição e deixe a busca pela quantidade ser uma estratégia também.",
    "Lei 48 – Assuma a identidade de quem você quer ser": "Se você deseja alcançar algo, comece a agir como se já fosse essa pessoa. Adote a mentalidade, comportamento e aparência da pessoa que você quer se tornar. As pessoas vão te tratar de acordo com a identidade que você assume."
  };

  const arteDaGuerra = {
    "1. Planejamento e Estratégia": "Vitória é alcançada antes do combate; planejamento é fundamental.",
    "2. Flexibilidade e Adaptabilidade": "Ajuste estratégias de acordo com as circunstâncias.",
    "3. Conhecimento do Inimigo e de Si Mesmo": "Compreenda o inimigo e conheça suas próprias forças e fraquezas.",
    "4. Engano e Desinformação": "Use enganos e desinformação para confundir o inimigo.",
    "5. Economia de Recursos": "Evite desperdício e gaste recursos eficientemente.",
    "6. Liderança Eficaz": "Um líder deve ser competente, ético e inspirador.",
    "7. A Arte de Evitar o Conflito": "A verdadeira maestria é evitar o conflito sempre que possível.",
    "8. Situacional e Estratégico": "As estratégias variam de acordo com as situações."
  };

  const oPrincipe = {
    "1. O Fim Justifica os Meios": "Líderes devem estar dispostos a tomar medidas impopulares em busca do sucesso.",
    "2. A Necessidade de Habilidade Política": "Habilidade e astúcia são cruciais na política.",
    "3. A Importância do Realismo": "Compreender a natureza humana e a busca pelo próprio interesse.",
    "4. Manter o Controle": "Líderes devem manter o controle absoluto para evitar instabilidade.",
    "5. A Virtù e a Fortuna": "Distinção entre habilidade e eventos imprevisíveis.",
    "6. Ser Temido em Vez de Amado": "A segurança está na obediência, não no amor.",
    "7. Divisão entre Ética Pública e Privada": "Separação entre ética pública e privada.",
    "8. A Inevitabilidade da Conquista": "Conquista é parte inevitável da política."
  };
  
  
  
  for (const leiTitulo in leis) {
    const lei = leis[leiTitulo];
    console.log(`${leiTitulo}`);
    console.log(`${lei}`);
    console.log("\n");
  }

  for (const arteTitulo in arteDaGuerra) {
    const arte = arteDaGuerra[arteTitulo];
    console.log(`${arteTitulo}`);
    console.log(`${arte}`);
    console.log("\n");
  }

  for (const opTitulo in oPrincipe) {
    const op = oPrincipe[opTitulo];
    console.log(`${opTitulo}`);
    console.log(`${op}`);
    console.log("\n");
  }
