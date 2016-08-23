/**
 * Created by toby on 19/10/15.
 */
//

console.log(gData);


function send() {
  var this_uid,this_message;
  this_uid = null;
  if($$('$datatable1').getSelectedId() != null){
    this_message = findContent($$('$datatable1').getSelectedId().id);
    this_uid = this_message['uid'];
  }
  var new_message = $$("mailform").getValues();
  var new_content = $$("mail-content").getValue();
  new_content = {html:new_content};
  console.log(new_content);
  //webix.message(new_message, null, 2);
  webix.ajax().post("/send",{message:new_message,content:new_content,msguid:this_uid},function(text,data,xmlHttpRequest){
    console.log(text);
    console.log(xmlHttpRequest);
    if(xmlHttpRequest.readyState == 4 && xmlHttpRequest.status == 200){
      $$('popupwin').close();
      webix.message('sent success',null,20);
    }
  })
}
function findContent(messageId){
  var content = null;
  for(var i=0;i<gData.length;i++){
    if(gData[i]['id'] == messageId)
      content = gData[i];
  }
  return content;
}
var ui = { rows:[
  {
    type: "space",
    rows:[
      {
        view: "toolbar", height: 45, elements:[
        {view: "label", label: "<span style='font-size: 18px;'>SECD Email Manager</span>"},
        {view:"icon", id:"id_settings",icon:"cog",popup:"setwindow"}
      ]
      },
      {
        type:"wide", cols:[
        {
          type: "clean",
          rows:[
            { view:"button", id: "id_create", type: "iconButton", label:"Create", icon:"envelope", width: 95 },
            {
              view:"tree",
              css: "rounded_top",
              select: true,
              width:280,
              type:{
                folder:function(obj){
                  return "<img src='common/tree/"+obj.icon+".png' style='position:relative; top:2px; left:-2px;'>";
                }
              },
              data:[
                { id:"1", value:"Inbox", icon:"inbox"},
                { id:"2", value:"Sent", icon:"sent"},
                { id:"3", value:"Drafts", icon:"drafts"},
                { id:"4", value:"Trash", icon:"trash"},
                { id:"5", value:"Contact Groups", open:true, icon:"folder", data:[
                  { id:"5-1", value:"Friends", icon:"file"},
                  { id:"5-2", value:"Blocked", icon:"file"}
                ]
                }
              ]
            }
            //{
            //  view: "calendar", css: "rounded_bottom"
            //}
          ]

        },
        { type:"wide",rows:[
          { view:"datatable",css: "rounded_top", scrollX:false, columns:[
            { id:"ch1", header:{ content:"masterCheckbox" }, template:"{common.checkbox()}",checkValue:'on', uncheckValue:'off', css:"center", width: 40 },
            { id:"from", width: 250, header:"From" },
            { id:"subject", header:"Subject", fillspace:true },
            { id:"date", header:"Date", width: 150 }
          ], select:"row", data:gData, ready:function(){
            console.log(gData);
            //webix.delay(function(){
            //this.select(2); //default select the first one
            //},this);
          }},
          { height: 45, cols:[
            { view:"button", id: "id_reply", type: "icon",  label:"Reply", icon:"reply", width: 95, hidden: true},
            { view:"button", id: "id_replyall", type: "icon", label:"Reply All", icon:"reply-all", width: 100, hidden: false },
            { view:"button", id: "id_delete", type: "icon", label:"Delete", icon:"times", width: 95,hidden:true },
            {},
            { view:"button", id: "id_prev", type: "icon", icon: "angle-double-left", width: 30 },
            { view:"button", id: "id_next", type: "icon", icon: "angle-double-right", width: 30 }
          ]},
          {view:"template", id: "mailview", scroll:"y", template:"No message available"}
        ]}
      ]


      }
    ]
  }
]};

var popup = {
  view:"window",
  width:700,
  left:50, top:50,
  position:"center",
  move:true,
  id:"popupwin",
  head:{
    view:"toolbar", cols:[
      {view:"label", label: "New Message" },
      { view:"button", label: 'Close', width: 90, align: 'right', click:"$$('popupwin').close();"}
    ]
  },
  body:{
    view: "form",
    id:"mailform",
    elements: [
      {
        view: "text",
        id:"reply-address",
        name: "To",
        label: "To",
        labelWidth: "100"
      },
      {
        view: "text",
        name: "Cc",
        label: "Cc",
        labelWidth: "100"
      },
      {
        view: "text",
        id:"subject",
        name: "Subject",
        label: "Subject",
        labelWidth: "100"
      },
      {
        id:'mail-content',
        view:"tinymce-editor",
        height:150
      },
      {
        margin:5,
        cols:[
          { view:"button", id:'id_cancel', value:"cancel",click:"$$('popupwin').close();"},
          { view:"button", value:"send" ,type:"form",click:send}
        ]
      }
    ],
    select:true
  }
};


var settings = {
  view:"popup", id:"setwindow",
  head:false, width: 100,
  body:{
    view:"list", scroll:false,
    yCount:2, select:true, borderless:true,
    template:"#lang#",
    data:[
      {id:"id_set1", lang:"Logout"},
      {id:"id_set2", lang:"French"}
    ],
    on:{"onAfterSelect":function(){
      $$("setwindow").hide();
    }}
  }
};

webix.ready(function() {

  webix.ui(ui);
  webix.ui(settings);

  $$("$datatable1").bind($$("$tree1"),function(obj,filter){
    return obj.folder == filter.id;
  });

  $$("$datatable1").attachEvent("onAfterSelect",function(obj){
    $$("id_reply").show();
    $$("id_delete").show();
    console.log(obj.id);
    var this_content = findContent(obj.id);
    if(this_content != null)
      $$("mailview").setHTML(this_content['text']);
  });


  $$("id_prev").attachEvent("onItemClick", function(id, e){
    webix.ajax("/page?id="+gData[$$("$datatable1").getSelectedId().id-1].id, function(text) {
      console.log(text);
    });
  });

  $$("id_next").attachEvent("onItemClick", function(id, e){
    webix.ajax("/page?id="+gData[$$("$datatable1").getSelectedId().id-1].nextpage, function(text) {
      console.log(text);
    });
  });

  $$("$tree1").select(1);

  /*
   * create email
   */
  $$("id_create").attachEvent("onItemClick",function(id,e){
    console.log('create clicked');
    webix.ui(popup).show();
  })

  /*
   * reply selected email
   */
  $$("id_reply").attachEvent("onItemClick",function(id,e){
    webix.ui(popup).show();
    console.log($$('$datatable1').getSelectedId().id);
    var this_obj = findContent($$('$datatable1').getSelectedId().id);
    var replyTo = this_obj.from;
    var subject = this_obj.subject;
    if(subject.indexOf('Re: ') != -1 || subject.indexOf('RE ' != -1)){
      console.log('has re');
      subject = subject.replace(/Re: /ig,'');
    }
    subject = "Re: "+subject;
    replyTo = replyTo.split('<')[1];
    replyTo = replyTo.substr(0,replyTo.length-1);

    console.log(replyTo);
    $$("reply-address").setValue(replyTo);
    $$("subject").setValue(subject);
  })


  /*
   * delete selected email
   */
  $$('id_delete').attachEvent('onItemClick',function(id,e){
    var this_msg = findContent($$('$datatable1').getSelectedId());
    console.log(this_msg['uid']);
    webix.ajax().put("/message",{message:this_msg},function(text, data, XmlHttpRequest){
      console.log('delete message'+text);
      if(xmlHttpRequest.readyState == 4 && XmlHttpRequest.status == 200){
        webix.message('deleted success',null,20);
      }
    })
  });

});
