const teamData = [
  {
    id: 1,
    firstName: "Ігор",
    lastName: "Александров",
    group: "ІМ-43",
    github: "https://github.com/Alexisonfire95"
  },
  {
    id: 2,
    firstName: "Владислав",
    lastName: "Бєлов",
    group: "ІМ-43",
    github: "https://github.com/M1RVKL"
  },
  {
    id: 3,
    firstName: "Денис",
    lastName: "Глушков",
    group: "ІМ-43",
    github: "https://github.com/denhlushkov"
  },
  {
    id: 4,
    firstName: "Даніїл",
    lastName: "Жмуденко",
    group: "ІМ-42",
    github: "https://github.com/JackDanielsClassic"
  },
  {
    id: 5,
    firstName: "Анастасія",
    lastName: "Журавель",
    group: "ІМ-43",
    github: "https://github.com/Anasstassik"
  },
  {
    id: 6,
    firstName: "Ілля",
    lastName: "Сизоненко",
    group: "ІМ-43",
    github: "https://github.com/utland"
  },
  {
    id: 7,
    firstName: "Микита",
    lastName: "Сухоруков",
    group: "ІМ-43",
    github: "https://github.com/Fererra"
  }
];

const findById = (ident) => {
  return teamData.find(member => member.id.toString() === ident.toString());
};

export { teamData, findById };