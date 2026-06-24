export type EmergencyContact = {
  id: string;
  label: string;
  number?: string;
  description: string;
  priority: number;
};

const defaultEmergencyContacts: EmergencyContact[] = [
  {
    id: "local-emergency-number",
    label: "Local emergency number",
    description: "Check the local official emergency number for this destination before travel.",
    priority: 1
  },
  {
    id: "hotel-or-host",
    label: "Hotel / host contact",
    description: "Keep your accommodation desk or host contact saved offline.",
    priority: 2
  },
  {
    id: "insurance-assistance",
    label: "Travel insurance assistance",
    description: "Save the insurer's urgent assistance number outside this app.",
    priority: 3
  }
];

const emergencyContactsByCountry: Record<string, EmergencyContact[]> = {
  AT: [
    {
      id: "general-emergency",
      label: "General emergency",
      number: "112",
      description: "European emergency number for urgent help in Austria.",
      priority: 1
    },
    {
      id: "fire",
      label: "Fire brigade",
      number: "122",
      description: "Fire and rescue emergency response.",
      priority: 2
    },
    {
      id: "police",
      label: "Police",
      number: "133",
      description: "Police emergency assistance in Austria.",
      priority: 3
    },
    {
      id: "ambulance",
      label: "Ambulance / medical emergency",
      number: "144",
      description: "Ambulance and urgent medical assistance.",
      priority: 4
    }
  ],
  CH: [
    {
      id: "general-emergency",
      label: "General emergency",
      number: "112",
      description: "Emergency number for urgent help in Switzerland.",
      priority: 1
    },
    {
      id: "police",
      label: "Police",
      number: "117",
      description: "Police emergency assistance in Switzerland.",
      priority: 2
    },
    {
      id: "fire",
      label: "Fire brigade",
      number: "118",
      description: "Fire and rescue emergency response.",
      priority: 3
    },
    {
      id: "ambulance",
      label: "Ambulance / medical emergency",
      number: "144",
      description: "Ambulance and urgent medical assistance.",
      priority: 4
    }
  ],
  CN: [
    {
      id: "police",
      label: "Police",
      number: "110",
      description: "Police emergency assistance in mainland China.",
      priority: 1
    },
    {
      id: "fire",
      label: "Fire",
      number: "119",
      description: "Fire and rescue emergency response.",
      priority: 2
    },
    {
      id: "ambulance",
      label: "Ambulance / medical emergency",
      number: "120",
      description: "Ambulance and urgent medical assistance.",
      priority: 3
    },
    {
      id: "traffic-accident",
      label: "Traffic accident",
      number: "122",
      description: "Traffic accident emergency assistance.",
      priority: 4
    }
  ],
  CZ: [
    {
      id: "general-emergency",
      label: "General emergency",
      number: "112",
      description: "European emergency number for urgent help in Czechia.",
      priority: 1
    },
    {
      id: "fire",
      label: "Fire brigade",
      number: "150",
      description: "Fire and rescue emergency response.",
      priority: 2
    },
    {
      id: "ambulance",
      label: "Ambulance / medical emergency",
      number: "155",
      description: "Ambulance and urgent medical assistance.",
      priority: 3
    },
    {
      id: "police",
      label: "Police",
      number: "158",
      description: "Police emergency assistance in Czechia.",
      priority: 4
    }
  ],
  ES: [
    {
      id: "general-emergency",
      label: "General emergency",
      number: "112",
      description: "Emergency number for urgent police, fire, or medical help in Spain.",
      priority: 1
    }
  ],
  FR: [
    {
      id: "general-emergency",
      label: "General emergency",
      number: "112",
      description: "European emergency number for urgent help in France.",
      priority: 1
    },
    {
      id: "medical",
      label: "Medical emergency",
      number: "15",
      description: "Urgent medical assistance in France.",
      priority: 2
    },
    {
      id: "police",
      label: "Police",
      number: "17",
      description: "Police emergency assistance in France.",
      priority: 3
    },
    {
      id: "fire",
      label: "Fire brigade",
      number: "18",
      description: "Fire and rescue emergency response.",
      priority: 4
    }
  ],
  GB: [
    {
      id: "general-emergency",
      label: "General emergency",
      number: "999",
      description: "Emergency services for police, fire, ambulance, or coastguard in the United Kingdom.",
      priority: 1
    },
    {
      id: "eu-emergency",
      label: "General emergency",
      number: "112",
      description: "Also connects to emergency services in the United Kingdom.",
      priority: 2
    }
  ],
  HU: [
    {
      id: "general-emergency",
      label: "General emergency",
      number: "112",
      description: "European emergency number for urgent help in Hungary.",
      priority: 1
    },
    {
      id: "ambulance",
      label: "Ambulance / medical emergency",
      number: "104",
      description: "Ambulance and urgent medical assistance.",
      priority: 2
    },
    {
      id: "fire",
      label: "Fire brigade",
      number: "105",
      description: "Fire and rescue emergency response.",
      priority: 3
    },
    {
      id: "police",
      label: "Police",
      number: "107",
      description: "Police emergency assistance in Hungary.",
      priority: 4
    }
  ],
  IT: [
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
  ],
  JP: [
    {
      id: "police",
      label: "Police",
      number: "110",
      description: "Police emergency assistance in Japan.",
      priority: 1
    },
    {
      id: "fire-ambulance",
      label: "Fire / ambulance",
      number: "119",
      description: "Fire, rescue, ambulance, and urgent medical help.",
      priority: 2
    },
    {
      id: "coast-guard",
      label: "Coast Guard",
      number: "118",
      description: "Maritime emergency assistance.",
      priority: 3
    },
    {
      id: "visitor-hotline",
      label: "Japan Visitor Hotline",
      number: "050-3816-2787",
      description: "Tourist assistance and emergency support information.",
      priority: 4
    }
  ],
  KR: [
    {
      id: "police",
      label: "Police",
      number: "112",
      description: "Police emergency assistance in South Korea.",
      priority: 1
    },
    {
      id: "fire-ambulance",
      label: "Fire / ambulance",
      number: "119",
      description: "Fire, rescue, ambulance, and urgent medical help.",
      priority: 2
    },
    {
      id: "travel-hotline",
      label: "Korea Travel Hotline",
      number: "1330",
      description: "Tourist assistance and interpretation support.",
      priority: 3
    }
  ]
};

export function getEmergencyContacts(countryCode?: string) {
  const normalizedCountryCode = countryCode?.toUpperCase() ?? "";

  return (
    emergencyContactsByCountry[normalizedCountryCode] ??
    (normalizedCountryCode === "UK" ? emergencyContactsByCountry.GB : undefined) ??
    defaultEmergencyContacts
  );
}
