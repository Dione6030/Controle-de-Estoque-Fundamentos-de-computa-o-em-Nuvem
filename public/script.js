let config, records=[], editId=null;
const $=id=>document.getElementById(id);
const text=(el,s)=>{el.textContent=String(s??'');};
const message=(s,error=false)=>{text($('message'),s);$('message').className=error?'error':'ok';};
async function api(url,options={}){
  const res=await fetch(url,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
  if(res.status===204)return null;
  const data=await res.json().catch(()=>({error:'Resposta inválida'}));
  if(!res.ok)throw new Error(data.error||'Erro de comunicação');
  return data;
}
function makeForm(){
  $('fields').replaceChildren();
  for(const f of config.fields){
    const wrapper=document.createElement('div');
    const label=document.createElement('label');label.htmlFor=f.name;text(label,f.label);
    let input;
    if(f.type.startsWith('select:')){
      input=document.createElement('select');
      for(const choice of f.type.slice(7).split('|')){const opt=document.createElement('option');opt.value=choice;text(opt,choice);input.append(opt);}
    }else{
      input=document.createElement('input');
      input.type= f.type==='integer'||f.type==='decimal'?'number':f.type;
      if(f.type==='decimal')input.step='0.01';
      if(f.type==='integer')input.step='1';
      if(f.name==='quantidade'||f.name==='preco')input.min='0';
      if(f.name==='ano'){input.min='1450';input.max='2100';}
    }
    input.id=f.name;input.name=f.name;input.required=true;
    wrapper.append(label,input);$('fields').append(wrapper);
  }
}
function rowButton(label,className,callback){const b=document.createElement('button');b.type='button';b.className=className;text(b,label);b.addEventListener('click',callback);return b;}
function formatValue(value,f){if(value==null)return '';if(f.type==='date')return String(value).slice(0,10);if(f.type==='decimal')return Number(value).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});return String(value);}
function render(){
  const search=$('search').value.toLocaleLowerCase('pt-BR');
  const view=records.filter(row=>config.fields.some(f=>formatValue(row[f.name],f).toLocaleLowerCase('pt-BR').includes(search)));
  text($('count'),records.length);$('tbody').replaceChildren();
  for(const record of view){
    const tr=document.createElement('tr');
    for(const f of config.fields){const td=document.createElement('td');text(td,formatValue(record[f.name],f));tr.append(td);}
    const actions=document.createElement('td'),wrap=document.createElement('div');wrap.className='buttons';
    wrap.append(rowButton('Editar','secondary',()=>beginEdit(record)),rowButton('Excluir','danger',()=>remove(record)));
    actions.append(wrap);tr.append(actions);$('tbody').append(tr);
  }
  $('empty').hidden=view.length>0;
}
async function load(){records=await api('/api/itens');render();}
function reset(){editId=null;$('form').reset();text($('formTitle'),'Novo registro');text($('save'),'Cadastrar');$('cancel').hidden=true;}
function beginEdit(record){editId=record.id;for(const f of config.fields){$(f.name).value=formatValue(record[f.name],f);if(f.type==='decimal')$(f.name).value=String(record[f.name]);}text($('formTitle'),`Editar registro #${record.id}`);text($('save'),'Salvar alterações');$('cancel').hidden=false;window.scrollTo({top:0,behavior:'smooth'});}
async function remove(record){if(!confirm(`Excluir o registro #${record.id}?`))return;try{await api('/api/itens/'+record.id,{method:'DELETE'});message('Registro excluído.');if(editId===record.id)reset();await load();}catch(e){message(e.message,true);}}
async function init(){
  try{
    config=await api('/api/config');document.documentElement.style.setProperty('--theme',config.color);text($('title'),config.title);text($('subtitle'),config.subtitle);text($('logo'),config.icon);document.title=config.title;
    makeForm();const header=document.createElement('tr');for(const f of config.fields){const th=document.createElement('th');text(th,f.label);header.append(th);}const th=document.createElement('th');text(th,'Ações');header.append(th);$('thead').append(header);
    $('form').addEventListener('submit',async e=>{e.preventDefault();const body={};for(const f of config.fields)body[f.name]=$(f.name).value;
      try{await api(editId===null?'/api/itens':'/api/itens/'+editId,{method:editId===null?'POST':'PUT',body:JSON.stringify(body)});message(editId===null?'Registro cadastrado.':'Registro atualizado.');reset();await load();}catch(err){message(err.message,true);}});
    $('cancel').addEventListener('click',reset);$('search').addEventListener('input',render);await load();
  }catch(e){message('Não foi possível carregar a aplicação: '+e.message,true);}
}
init();
