const API = import.meta.env.VITE_API


export const setData = async (mutation: any) => {
  var query = JSON.stringify(mutation);
  const encodedCredentials = btoa("lcw112:test");
  console.log("query", query);
  const headers = {
    "Content-Type": "application/json",
    Authorization: ` Basic ${encodedCredentials}`,
  };
  let APIendpoint = `http://${API}/orthanc/tools/create-dicom`;
  const res = await fetch(APIendpoint, {
    method: "POST",
    headers,
    body: query,
  });

  const result = await res.json();
  console.log("Mutation", result);
  if (result.errors) {
    // throw each error message
    result.errors.forEach((error: any) => {
      console.log(error);
      throw new Error(error.message);
    });
  }
  return result.data;
};
