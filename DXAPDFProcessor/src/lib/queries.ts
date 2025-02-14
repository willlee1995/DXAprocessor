const API = import.meta.env.VITE_API

import fetchData from "@/helpers/fetchData";

export const getDXACase = async (today: string) => {
  let APIendpoint = `http://${API}/tools/find`;
  let query = {
    Level: "Study",
    Query: {
      StudyDate: today,
    },
    Expand: true,
  };
  const data = await fetchData(APIendpoint, query);
  console.log(data);
  console.log(import.meta.env.API)
  return data;
};
