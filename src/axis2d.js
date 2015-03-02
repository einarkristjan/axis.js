// namespace
Axis2D = { version: '0.7.0dev' };

// helpers
Axis2D.typeCheck = function(variable, varName, type) {
  var error = false,
      errorTxt = '',
      varObjName = variable.constructor.toString();

  varObjName = varObjName.match(/function (.*)\(/)[1];

  if(typeof type === 'string' && type !== varObjName) {
    error = true;
  }
  else if(typeof type === 'function' && !(variable instanceof type)) {
    error = true;
  }

  if(error) {
    errorTxt += 'In last stack calls, ';
    errorTxt += 'parameter "'+varName+'" should be of type: ' + type;
    throw TypeError(errorTxt);
  }
};

// export
if(typeof module === 'object') {
  module.exports = Axis2D;
}
