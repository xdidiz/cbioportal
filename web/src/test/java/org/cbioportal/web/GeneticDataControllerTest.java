package org.cbioportal.web;

import java.util.ArrayList;
import java.util.List;

import org.cbioportal.model.GeneticData;
import org.cbioportal.service.GeneticDataService;
import org.hamcrest.Matchers;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@RunWith(SpringJUnit4ClassRunner.class)
@WebAppConfiguration
@ContextConfiguration("/applicationContext-web.xml")
@Configuration
public class GeneticDataControllerTest {

    @Autowired
    private WebApplicationContext wac;

    @Autowired
    private GeneticDataService geneticDataService;
    private MockMvc mockMvc;

    @Bean
    public GeneticDataService geneticDataService() {
        return Mockito.mock(GeneticDataService.class);
    }

    //test data
    private String geneticProfileStableId = "acc_tcga_mrna";
    
    @Before
    public void setUp() throws Exception {

        Mockito.reset(geneticDataService);
        mockMvc = MockMvcBuilders.webAppContextSetup(wac).build();
    }

    @Test
    public void  getAllGenesDefaultProjection() throws Exception {

    	List<GeneticData> geneticDataList = new ArrayList<GeneticData>();//TODO createGeneList();

        Mockito.when(geneticDataService.getAllGeneticDataInGeneticProfile(Mockito.anyString(), 
        		Mockito.anyString(), Mockito.anyInt(), Mockito.anyInt())).thenReturn(geneticDataList);

        
        //@RequestMapping(value = "/genetic-profiles/{geneticProfileId}/genetic-data", method = RequestMethod.GET)
        //@ApiOperation("Get all genetic data in a genetic profile")
        //public ResponseEntity<List<GeneticData>> getAllGeneticDataInGeneticProfile(
        	//	@ApiParam(required = true, value = "Genetic profile ID, e.g. acc_tcga_mrna")
        
        mockMvc.perform(MockMvcRequestBuilders.get("/genetic-profiles/"+ geneticProfileStableId + "/genetic-data")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(MockMvcResultMatchers.jsonPath("$", Matchers.hasSize(2)))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].entrezGeneId").value(1));
        /*
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].hugoGeneSymbol").value(HUGO_GENE_SYMBOL_1))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].type").value(TYPE_1))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].cytoband").value(CYTOBAND_1))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].length").value(LENGTH_1))
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].chromosome").value(CHROMOSOME_1))
                .andExpect(MockMvcResultMatchers.jsonPath("$[1].entrezGeneId").value(ENTREZ_GENE_ID_2))
                .andExpect(MockMvcResultMatchers.jsonPath("$[1].hugoGeneSymbol").value(HUGO_GENE_SYMBOL_2))
                .andExpect(MockMvcResultMatchers.jsonPath("$[1].type").value(TYPE_2))
                .andExpect(MockMvcResultMatchers.jsonPath("$[1].cytoband").value(CYTOBAND_2))
                .andExpect(MockMvcResultMatchers.jsonPath("$[1].length").value(LENGTH_2))
                .andExpect(MockMvcResultMatchers.jsonPath("$[1].chromosome").value(CHROMOSOME_2));*/

    }


}
