export interface DepartmentData {
  name: string;
  communes: string[];
}

export const BENIN_DEPARTMENTS: DepartmentData[] = [
  {
    name: 'Alibori',
    communes: ['Banikoara', 'Gogounou', 'Kandi', 'Karimama', 'Malanville', 'Segbana']
  },
  {
    name: 'Atacora',
    communes: ['Boukoumbé', 'Cobly', 'Kérou', 'Kouandé', 'Matéri', 'Natitingou', 'Péhunco', 'Tanguiéta', 'Toucountouna']
  },
  {
    name: 'Atlantique',
    communes: ['Allada', 'Abomey-Calavi', 'Kpomassè', 'Ouidah', 'Sô-Ava', 'Toffo', 'Tori-Bossito', 'Zè']
  },
  {
    name: 'Borgou',
    communes: ['Parakou', 'Bembérékè', 'Kalalé', "N'Dali", 'Nikki', 'Pèrèrè', 'Sinendé', 'Tchaourou']
  },
  {
    name: 'Collines',
    communes: ['Dassa-Zoumè', 'Bantè', 'Glazoué', 'Ouèssè', 'Savalou', 'Savè']
  },
  {
    name: 'Couffo',
    communes: ['Aplahoué', 'Djakotomey', 'Dogbo', 'Klouékanmè', 'Lalo', 'Toviklin']
  },
  {
    name: 'Donga',
    communes: ['Djougou', 'Bassila', 'Copargo', 'Ouaké']
  },
  {
    name: 'Littoral',
    communes: ['Cotonou']
  },
  {
    name: 'Mono',
    communes: ['Lokossa', 'Athiémé', 'Bopa', 'Comè', 'Grand-Popo', 'Houéyogbé']
  },
  {
    name: 'Ouémé',
    communes: ['Porto-Novo', 'Adjarra', 'Adjohoun', 'Aguégués', 'Akpro-Missérété', 'Avrankou', 'Bonou', 'Dangbo', 'Sèmè-Kpodji']
  },
  {
    name: 'Plateau',
    communes: ['Adja-Ouèrè', 'Kétou', 'Pobè', 'Sakété', 'Ifangni']
  },
  {
    name: 'Zou',
    communes: ['Abomey', 'Agbangnizon', 'Bohicon', 'Covè', 'Djidja', 'Ouinhi', 'Zagnanado', 'Za-Kpota', 'Zogbodomey']
  }
];

export const DEPARTMENT_NAMES = BENIN_DEPARTMENTS.map(d => d.name);

export const getCommunesByDepartment = (departmentName?: string): string[] => {
  if (!departmentName) return [];
  const found = BENIN_DEPARTMENTS.find(d => d.name.toLowerCase() === departmentName.trim().toLowerCase());
  return found ? found.communes : [];
};
