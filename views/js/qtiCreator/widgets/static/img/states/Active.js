define([
    'taoQtiItem/qtiCreator/widgets/states/factory',
    'taoQtiItem/qtiCreator/widgets/states/Active',
    'tpl!taoQtiItem/qtiCreator/tpl/forms/static/img',
    'taoQtiItem/qtiCreator/widgets/helpers/formElement',
    'lodash',
    'nouislider'
], function(stateFactory, Active, formTpl, formElement, _){

    var ImgStateActive = stateFactory.extend(Active, function(){

        this.initForm();

    }, function(){

        this.widget.$form.empty();
    });

    var _floatImg = function(widget, position){

        var $container = widget.$container,
            img = widget.element;
        
        //remove class
        $container.removeClass('rgt lft');
        
        _removeClass(img, 'rgt');
        _removeClass(img, 'lft');
        switch(position){
            case 'right':
                $container.addClass('rgt');
                _addClass(img, 'rgt');
                break;
            case 'left':
                $container.addClass('lft');
                _addClass(img, 'lft');
                break;
        }
    };
    
    var _removeClass = function(element, className){
        
        var clazz = element.attr('class') || '';
        if(clazz){
            var regex = new RegExp('(?:^|\\s)' + className + '(?:\\s|$)', '');
            clazz = clazz.replace(regex, '').replace( /^\s+/, '' );
            if(clazz){
                element.attr('class', clazz);
            }else{
                element.removeAttr('class');
            }
        }
    };
    
    var _addClass = function(element, className){
        var clazz = element.attr('class') || '';
        if(!_containClass(clazz, className)){
            element.attr('class', clazz + (clazz.length ? ' ' : '') + className);
        }
    };

    var _containClass = function(allClassStr, className){
        var regex = new RegExp('(?:^|\\s)' + className + '(?:\\s|$)', '');
        return allClassStr && regex.test(allClassStr);
    };

    ImgStateActive.prototype.initForm = function(){

        var _widget = this.widget,
            $img = _widget.$original,
            $form = _widget.$form,
            img = _widget.element,
            responsive = true;

        $form.html(formTpl({
            src : img.attr('view'),
            alt : img.attr('alt'),
            longdesc : img.attr('longdesc'),
            height : img.attr('height') || '',
            width : img.attr('width') || '',
            responsive : responsive
        }));
        
        //init slider and set align value before ...
        _initSlider(_widget);
        _initAlign(_widget);
        //... init standard ui widget
        formElement.initWidget($form, img);

        //init data change callbacks
        formElement.initDataBinding($form, img, {
            src : formElement.getAttributeChangeCallback(),
            alt : formElement.getAttributeChangeCallback(),
            longdesc : formElement.getAttributeChangeCallback(),
            align : function(img, value){
                _floatImg(_widget, value);
            },
            height : function(img, value, name){
                img.attr(name, value);
                $img.height(value);
            },
            width : function(img, value, name){
                img.attr(name, value);
                $img.width(value);
            }
        });
    };

    var _initAlign = function(widget){

        var align = 'default',
            clazz = widget.element.attr('class') || '';
        
        //init float positioning:
        if(_containClass(clazz, 'rgt')){
            align = 'right';
        }else if(_containClass(clazz, 'lft')){
            align = 'left';
        }

        _floatImg(widget, align);
        widget.$form.find('select[name=align]').val(align);
    };

    var _initSlider = function(widget){

        var $container = widget.$container,
            $form = widget.$form,
            $slider = $form.find('.img-resizer-slider'),
            img = widget.element,
            $img = $container.find('img'),
            $height = $form.find('[name=height]'),
            $width = $form.find('[name=width]'),
            original = {
                h : img.attr('height') || $img.height(),
                w : img.attr('width') || $img.width()
            };
            
        $slider.noUiSlider({
            range : {
                min : 10,
                max : 200
            },
            start : 100
        });

        $slider.on('slide', _.throttle(function(e, value){

            var ratio = (value / 100),
                w = parseInt(ratio * original.w),
                h = parseInt(ratio * original.h);

            $width.val(w).change();
            $height.val(h).change();
        },200));
    };

    return ImgStateActive;
});