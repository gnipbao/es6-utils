import $ from '../src/dom';
console.log($);
console.log($('li'));
console.log($('ul').children());
$('.first').addClass('yellow');
console.log($('.first').offset());
console.log($('.first').children());
console.log($('#box').height());
$('.first').listen('click',function(){
  $(this).toggleClass('blue');
  // console.log($(this));
});
$('ul').children().on('click', function(){
  $(this).addClass('blue');
})
