#include <nan.h>
#include <stdio.h>
#include "md.h"

#define NUM_OF_SRC 13

NAN_METHOD(GetMD)
{
    // 返り値を設定
    //info.GetReturnValue().Set(Nan::New("hello, world").ToLocalChecked());
	/*
	double pv[13][13] = {
		{35.01,33,54,101,35.74,42.52,42.09,1.006,0.465,2.428,1104,6.4,9.2},
		{35.01,33,54,101,35.74,42.6,42.09,1.006,0.465,2.433,1098,6.4,9.2},
		{35.01,33,54,101,35.74,42.68,42.09,1.006,0.466,2.438,1110,6.4,9.2},
		{6.34,25,207,0,2.65,45.73,-6.37,-2.84,5.49,0.594,0.48,2.628,5178},
		{6.34,25,207,0,2.62,45.73,-6.35,-2.74,5.36,0.597,0.479,2.628,5196},
		{6.32,25,207,0,2.59,45.71,-6.33,-2.71,5.3,0.598,0.479,2.627,5178}
	};
	
	for(int i=0; i<6; i++)
	{
		double MD = GetMD(pv[i]);
		printf("%f\n", MD);
	}
	*/
	
	//printf("pv is ...");
	double pv[NUM_OF_SRC];
	for(int i=0; i<NUM_OF_SRC; i++)
	{
		pv[i] =info[i]->NumberValue();
		//printf("%f\n", pv[i]);
	}
	
	//printf("ave is ...");
	double ave[NUM_OF_SRC];
	for(int i=NUM_OF_SRC; i<NUM_OF_SRC+NUM_OF_SRC; i++)
	{
		ave[i-NUM_OF_SRC] =info[i]->NumberValue();
		//printf("%f\n", ave[i]);
	}
	
	//printf("sd is ...");
	double sd[NUM_OF_SRC];
	for(int i=NUM_OF_SRC+NUM_OF_SRC; i<NUM_OF_SRC+NUM_OF_SRC+NUM_OF_SRC; i++)
	{
		sd[i-NUM_OF_SRC-NUM_OF_SRC] =info[i]->NumberValue();
		//printf("%f\n", sd[i]);
	}
	
	double MD = CalcMD(pv, ave, sd);
	//printf("MD=%f\n", MD);
	
	v8::Local<v8::Array> arr = Nan::New<v8::Array>(2);
    Nan::Set(arr, 0, Nan::New(MD));
    //Nan::Set(arr, 1, Nan::New(MD+1));
    info.GetReturnValue().Set(arr);
	

	
}

NAN_MODULE_INIT(init)
{
    // GetMD 関数を外部に公開
    NAN_EXPORT(target, GetMD);
}

NODE_MODULE(my_extension, init);