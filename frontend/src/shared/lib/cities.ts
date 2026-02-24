import { usersData } from '../mocks/usersData';

export const cities = [...usersData]
  .sort((a, b) => a.city.localeCompare(b.city))
  .reduce(
    (acc, city) => {
      acc[city.city] = [city.city];
      return acc;
    },
    {} as { [key: string]: readonly string[] },
  );
