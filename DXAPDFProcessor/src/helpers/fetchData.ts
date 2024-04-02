//@ts-ignore
//@ts-ignore

const fetchData = async (API: string, query: any) => {
  const encodedCredentials = btoa("pacs:pacs");
  const headers = {
    "Content-Type": "application/json",
    Authorization: ` Basic ${encodedCredentials}`,
  };
  const res = await fetch(API, {
    method: "POST",
    headers,
    body: JSON.stringify(query),
  });
  const json = await res.json();
  if (json.errors) {
    for (let error in json.errors) {
      console.error(error);
    }
  }
  return json;
};

export default fetchData;
