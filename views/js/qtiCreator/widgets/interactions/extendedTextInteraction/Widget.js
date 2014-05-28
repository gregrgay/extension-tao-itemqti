define([
'taoQtiItem/qtiCreator/widgets/interactions/Widget',
'taoQtiItem/qtiCreator/widgets/interactions/extendedTextInteraction/states/states'
], function(Widget, states){
    
    var ExtendedTextInteractionWidget = Widget.clone();
    
    ExtendedTextInteractionWidget.initCreator = function(){
        this.registerStates(states);
        Widget.initCreator.call(this);
        
        // Disable inputs until response edition.
        this.$container.find('input, textarea').attr('disabled', 'disabled');
    };
    
    return ExtendedTextInteractionWidget;
});