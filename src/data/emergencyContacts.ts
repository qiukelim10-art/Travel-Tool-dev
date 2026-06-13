export type EmergencyContact = {
  id: string;
  label: string;
  number: string;
  description: string;
  priority: number;
};

export const emergencyContacts: EmergencyContact[] = [
  {
    id: "general-emergency",
    label: "General emergency",
    number: "112",
    description: "Single European emergency number for urgent help.",
    priority: 1
  },
  {
    id: "police",
    label: "Police",
    number: "113",
    description: "Police emergency assistance in Italy.",
    priority: 2
  },
  {
    id: "fire-brigade",
    label: "Fire brigade",
    number: "115",
    description: "Fire and rescue emergency response.",
    priority: 3
  },
  {
    id: "ambulance-medical",
    label: "Ambulance / medical emergency",
    number: "118",
    description: "Ambulance and urgent medical assistance.",
    priority: 4
  }
];
