const sortObj = (sort) => {
  let sortObject = {};
  if (sort) {
    const sortFields = sort.spilt(",");
    sortFields.forEach((sortField) => {
      if (sortField.startsWith("-")) {
        sortObject[sortField.subString(1)] = -1;
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
