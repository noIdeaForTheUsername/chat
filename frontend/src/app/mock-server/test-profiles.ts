import { UserProfile } from "@app/profiles/profile.interface";

export interface ServerUserProfile extends UserProfile {
  id: number
}

export let testProfiles: ServerUserProfile[] = [
  {
    id: 1,
    type: 'user',
    login: "the_exampler",
    name: "Example",
    telephone: "+48111111111",
  },
  {
    id: 2,
    type: 'user',
    login: "diesel_engine",
    telephone: "+48123123123"
  },
  {
    id: 3,
    type: 'user',
    login: "the_physical",
    name: "Albert Einstein",
    telephone: undefined,
    bio: "Did you know that E=mc^2?"
  },
  {
    id: 4,
    type: 'user',
    login: "niemiecki_demon",
    name: "Donald Tusk",
    telephone: undefined
  },
  {
    id: 5,
    type: 'user',
    login: "salad",
    name: "Sałatka Owocowa",
    telephone: undefined
  },
  {
    id: 6,
    type: 'user',
    login: "dumplings",
    name: "Pierogi Nasłodko",
    telephone: undefined
  },
  {
    id: 7,
    type: 'user',
    login: "the_exampler_7",
    name: "Example",
    telephone: undefined
  },
  {
    id: 8,
    type: 'user',
    login: "the_exampler_8",
    name: "Example",
    telephone: undefined
  },
  {
    id: 9,
    type: 'user',
    login: "the_exampler_9",
    name: "Example",
    telephone: undefined
  },
  {
    id: 10,
    type: 'user',
    login: "the_exampler_10",
    name: "Example",
    telephone: undefined
  },
  {
    id: 11,
    type: 'user',
    login: "the_exampler_11",
    name: "Example",
    telephone: undefined
  },
  {
    id: 12,
    type: 'user',
    login: "the_exampler_12",
    name: "Example",
    telephone: undefined
  },
  {
    id: 13,
    type: 'user',
    login: "the_exampler_13",
    name: "Example",
    telephone: undefined
  },
  {
    id: 14,
    type: 'user',
    login: "the_exampler_14",
    name: "Example",
    telephone: undefined
  },
  {
    id: 15,
    type: 'user',
    login: "the_exampler_15",
    telephone: undefined
  },
  {
    id: 16,
    type: 'user',
    login: "the_exampler_16",
    telephone: undefined
  },
  {
    id: 17,
    type: 'user',
    login: "the_exampler_17",
    telephone: undefined
  },
  {
    id: 18,
    type: 'user',
    login: "the_exampler_18",
    telephone: undefined
  },
  {
    id: 20,
    type: 'user',
    login: "nuclear-guy",
    name: "Igor",
    telephone: "+48600600600"
  }
];