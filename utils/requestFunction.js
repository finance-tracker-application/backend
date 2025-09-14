const sortObj = (sort) => {
  let sortObject = {};
  if (sort) {
    const sortFields = sort.split(",");
    sortFields.forEach((sortField) => {
      if (sortField.startsWith("-")) {
        sortObject[sortField.substring(1)] = -1;
      } else {
        sortObject[sortField] = 1;
      }
    });
  }
  return sortObject;
};

export default {
  sortObj,
};
