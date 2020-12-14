class ClickableJournal extends JournalSheet{
    static getDefaultOptions(){
        return mergeObject(super.defaultOptions, { 
            classes: [],
            closeOnSubmit: false,
            submitOnChange: true,
            submitOnClose: true,
            editable: true


        });
    }
}