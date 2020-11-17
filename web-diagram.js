//==============ANGREEMENT=================================
/*
	options =
	{
		maxValue:
		itemsColors://диапазон цветов элементов
		gridColor:
		signColor://цвет подписей
		data://данные в виде массива обьектов
		dataHeaders://заголовки полей данных
		container://селектор контейнера
		width:
		height:
		vWidth://вьюбокс ширина
		vHeight://вьюбокс высота
	}


*/
//=========================================================

; var diagWeb = (function(){

	var result = {};

	result.build = function(options)
	{
		var result      = {};
		var padding     = options.padding;
		var width       = options.vWidth;
		var height      = options.vHeight;
		var radius      = (d3.min([width,height])-2*padding) / 2;
		var container   = d3.select(options.container);
		var indent      = 2 * Math.PI/4;
		var prefix      = "diagweb-";
		var tops        = 0;//кол-во осей
		var headers     = options.dataHeaders;
		var data        = options.data;
		var color       = d3.scale.category10();
		var maxValue    = options.maxValue;
		var cx = radius + padding;
		var cy = radius + padding;
		var itemsColors = options.itemsColors;
		

		var getColor = function(d,i){if(itemsColors!=undefined){return itemsColors[i];} else return color( Math.random() * 360);};//функция для получения цветов


		var svg = container.append("svg")
				 			.attr("width",options.width)
				 			.attr("height",options.height)
				 			.attr("viewBox","0 0 " + width + " " + height);

		var grid = svg.append("g")
					   .attr("class",prefix + "grid");

		var axes = svg.append("g")
					  .classed(prefix+"axes",true);

		var maxValueData = data[0][0];
		var minValueData = 0;

		for(var i = 0;i<data.length;i++)
		{
			var max = d3.max(data[i]);
			if(max > maxValueData){maxValueData = max;}
		}

		if(maxValue!=undefined){maxValueData = maxValue;}

		//=======================RENDER RAXIS========================================

		var scaleR = d3.scale.linear()//линейная зависимость по радиусу
							 .domain([0,maxValueData])
							 .range([0,radius]);


		var ticks     = scaleR.ticks().length;//предварительное количество делений шкалы
		var minus     = (maxValueData - d3.max(scaleR.ticks()));//длина избытка радиуса от последнего деления
		var maxValueAxis  = scaleR.ticks()[2]-scaleR.ticks()[1]+d3.max(scaleR.ticks());

		if(maxValue != undefined)maxValueAxis = maxValue;

		if(minus != 0)
		{
			ticks += 1;
			scaleR = d3.scale.linear()
							 .domain([0,maxValueAxis])
							 .range([0,radius]);
		}

		scaleRReverse = d3.scale.linear()//линейная зависимость по радиусу инвертированна
							 .domain([maxValueAxis,0])
							 .range([0,radius]);

		var RAxis = d3.svg.axis()
		         		  .scale(scaleRReverse)
		         		  .orient("right");


		var RadiusAxis = axes.insert("g",":first-child")
		                     .attr("class",prefix+"R-axis")
		                     .attr("transform","translate ("+(radius+padding)+","+(padding)+")")
		                     .call(RAxis)

		RadiusAxis.select(".domain").remove();
		RadiusAxis.selectAll("line").attr("stroke",options.gridColor);
		RadiusAxis.selectAll("text").attr("fill",options.signColor)
		//========================================================


		//==================RENDER AXES===========================

		if(data == null)return;

		for(var i in headers){tops++;}//считаем кол-во осей
		if(tops<3)return;

		var step = 2*Math.PI / tops;//шаг оси

		var columns = grid.append("g")
					   		  .classed(prefix + "columns",true);

		for(var i = 0;i<tops;i++)
		{
			columns.append("line")
				   .attr("x1",cx)
				   .attr("y1",cy)
				   .attr("x2",cx + radius * Math.cos( - indent + step * i ))
				   .attr("y2",cy + radius * Math.sin( - indent + step * i ))
				   .attr("stroke",options.gridColor);
		}
		//========================================================

		//=====================RENDER GRID LINES==================

		var rows = grid.append("g").classed(prefix+"rows",true);
		var tick = RadiusAxis.selectAll(".tick");//выбираем все тики
		var text = tick.selectAll("text");//выбирает их значения

		for(var i = 0;i<ticks;i++)
		{
			
			var r = +text[i][0].textContent;

			rows.append("path")
				.attr("d",function()
					{
						var res = "M "+(cx+scaleR(r)*Math.cos(-indent))+","+(cy+scaleR(r)*Math.sin(-indent))+" ";
							for(var g = 1;g<tops+1;g++)
							{
								res+="L "+(cx+scaleR(r)*Math.cos(-indent+step*g)+","+(cy+scaleR(r)*Math.sin(-indent+step*g))+" ");
							}
						return res;
					})
				.attr("fill","none")
				.attr("stroke",options.gridColor)
			
		}

		//========================================================

		//======================RENDER SIGNS=======================
		var signs = svg.append("g")
		   			   .classed(prefix+"signs",true);

		signs.selectAll("text")
		     .data(headers)
		     .enter()
		   	 .append("text")
		     .text(function(d,i){return d;})
		     .attr("fill",options.signColor)
		     .attr("x",function(d,i){return cx + radius*1.1 * Math.cos( -indent+step * i )})
		     .attr("y",function(d,i){return cy + radius*1.1 * Math.sin( -indent+step * i )})

		//========================================================

		//======================RENDER BODY=======================

		var body = svg.append("g")
		   			  .classed(prefix+"body",true);

		body.selectAll("path")
			.data(data)
			.enter()
			.append("path")
			.attr("d",function(d,index)
			{

				var res="";
				res+="M "+( cx+scaleR(d[0])*Math.cos(-indent+0) )+","+( cy+scaleR(d[0])*Math.sin(-indent+0)+" " );//начальная точка

				for(var i =1;i<d.length;i++)
				{
					res+="L "+( cx+scaleR(d[i])*Math.cos(-indent+step*i) )+","+( cy+scaleR(d[i])*Math.sin(-indent+step*i)+" " );//основные линии
				}

				res+="Z";


				return res;
			})
			.attr("fill",function(d,i){return getColor(d,i);})
			.attr("opacity",0.5)

		//========================================================


		result.update = function(datas)
		{
			body.selectAll("path")
				.data(datas)
				.transition()
				.duration(5000)
				.attr("d",function(d,index)
				{

					var res="";
					res+="M "+( cx+scaleR(d[0])*Math.cos(-indent+0) )+","+( cy+scaleR(d[0])*Math.sin(-indent+0)+" " );//начальная точка

					for(var i = 1;i<d.length;i++)
					{
						res+="L "+( cx+scaleR(d[i])*Math.cos(-indent+step*i) )+","+( cy+scaleR(d[i])*Math.sin(-indent+step*i)+" " );//основные линии
					}

					res+="Z";


					return res;
				})
				.attr("fill",function(d,i){return getColor(d,i);})
				.attr("opacity",0.5)
		}
		result.remove  = function(){svg.remove();}
		result.rebuild = function(options){this.remove();diagWeb.build(options);}
		return result;
	}

	return result;
})();