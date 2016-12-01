package org.cbioportal.service.impl;

import java.util.ArrayList;
import java.util.List;

import org.cbioportal.model.GeneticData;
import org.cbioportal.model.GeneticDataSamples;
import org.cbioportal.model.GeneticDataValues;
import org.cbioportal.model.GeneticEntity;
import org.cbioportal.model.GeneticProfile;
import org.cbioportal.persistence.GeneticDataRepository;
import org.cbioportal.persistence.GeneticProfileRepository;
import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.runners.MockitoJUnitRunner;

@RunWith(MockitoJUnitRunner.class)
public class GeneticDataServiceImplTest extends BaseServiceImplTest {

    @InjectMocks
    private GeneticDataServiceImpl geneticDataService;
    
    @Mock
    private GeneticDataRepository geneticDataRepository;
    
    @Mock
    private GeneticEntityRepository geneticEntityRepository;
    
    @Mock
    private GeneticProfileRepository geneticProfileRepository;


    @Test
    public void getAllGeneticDataInGeneticProfile() throws Exception {

        String geneticProfileId = "acc_tcga_mrna";
        //stub this
        GeneticProfile dummyGeneticProfile = new GeneticProfile();
        dummyGeneticProfile.setStableId(geneticProfileId);
        dummyGeneticProfile.setGeneticProfileId(1);
        Mockito.when(geneticProfileRepository.getGeneticProfile(geneticProfileId)).thenReturn(dummyGeneticProfile);
        //call
        GeneticProfile geneticProfile = geneticProfileRepository.getGeneticProfile(geneticProfileId);

        //stub the samples to be returned by repository method: 
        GeneticDataSamples samples = new GeneticDataSamples();
        samples.setGeneticProfileId(geneticProfile.getGeneticProfileId());
        samples.setOrderedSamplesList("SAMPLE_1,SAMPLE_2");
        Mockito.when(geneticDataRepository.getGeneticDataSamplesInGeneticProfile(geneticProfileId, PAGE_SIZE, PAGE_NUMBER)).thenReturn(samples);
        
        //stub the genet list and values to be returned by repository method:
        List<GeneticDataValues> geneListAndValues = new ArrayList<GeneticDataValues>();
        geneListAndValues.add(new GeneticDataValues());
        geneListAndValues.get(0).setGeneticEntityId(1);
        geneListAndValues.get(0).setGeneticProfileId(geneticProfile.getGeneticProfileId());
        geneListAndValues.get(0).setOrderedValuesList("0.2,34.99");
        geneListAndValues.add(new GeneticDataValues());
        geneListAndValues.get(1).setGeneticEntityId(2);
        geneListAndValues.get(1).setGeneticProfileId(geneticProfile.getGeneticProfileId());
        geneListAndValues.get(1).setOrderedValuesList("0.89,15.09");
        Mockito.when(geneticDataRepository.getGeneticDataValuesInGeneticProfile(geneticProfileId, null, PAGE_SIZE, PAGE_NUMBER)).thenReturn(geneListAndValues);
        
    	//call the service getAllGeneticDataInGeneticProfile and check if it correctly combines GeneticDataSamples and GeneticDataValues
        //into the corresponding list of GeneticData elements:
    	List<GeneticData> result = geneticDataService.getAllGeneticDataInGeneticProfile(geneticProfileId,  PROJECTION,  PAGE_SIZE, PAGE_NUMBER);
    	
    	//what we expect: 2 samples x 2 genetic entities = 4 GeneticData items:
    	//SAMPLE_1:
    	//   entity id 1 value: 0.2
    	//   entity id 2 value: 0.89
    	//SAMPLE_2:
    	//   entity id 1 value: 34.99
    	//   entity id 2 value: 15.09
        List<GeneticData> expectedGeneticDataList = new ArrayList<>();
        expectedGeneticDataList.add(getGeneticDataItem());

        Assert.assertEquals(expectedGeneticDataList, result);
    }

    private GeneticData getSimpleFlatGeneticDataItem(String entityStableId, String geneticProfileStableId){
    	GeneticData item = new GeneticData();
    	
    	GeneticEntity geneticEntity = geneticEntityRepository.getGeneticEntity(entityStableId);
    	// geneticEntity.setEntityType(entityType); not used for now...or we would have to add it to GeneticDataValues and GeneticDataSamples
    	//item.setGeneticEntity(geneticEntity);
    	item.setGeneticEntityId(geneticEntity.getEntityId());
    	item.setGeneticEntityStableId(entityStableId);
    	
    	GeneticProfile geneticProfile = geneticProfileRepository.getGeneticProfile(geneticProfileStableId);
    	//item.setGeneticProfile(geneticProfile);
    	item.setGeneticProfileId(geneticProfile.getGeneticProfileId());
    	item.setGeneticProfileStableId(geneticProfile.getStableId());
    	
    	//item.setSample(sample);
    	
    	return item;
    }

}